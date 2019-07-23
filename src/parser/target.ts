import {
    DynamicGraph,
    Edge,
    Graph,
    Token,
    Tokenizer,
    UNKNOWNTOKEN
} from 'token-flow';

import {
    AttributeInfo,
    Cart,
    ICartOps,
    IRuleChecker,
    ItemInstance,
    State,
} from 'prix-fixe';

import {
    ATTRIBUTE,
    ENTITY,
    LexicalAnalyzer,
    Span,
    Tokenization
} from '../lexer';

import { EntityBuilder } from './entity_builder';
import { HypotheticalItem, SequenceToken, Segment } from './interfaces';
import { splitOnEntities } from './parser_utilities';


///////////////////////////////////////////////////////////////////////////////
//
// Generating subgraphs
//
///////////////////////////////////////////////////////////////////////////////
export function subgraphFromItems(
    attributes: AttributeInfo,
    lexer: LexicalAnalyzer,
    cart: Cart,
    graph: Graph,
    span: Span
): Graph {
    const tokens = new Set<Token>();
    for (const item of cart.items) {
        addTokens(attributes, lexer, item, tokens);
    }

    return createSubgraph(lexer.tokenizer, graph.edgeLists, tokens, span);
}

function addTokens(
    attributes: AttributeInfo,
    lexer: LexicalAnalyzer,
    item: ItemInstance,
    tokens: Set<Token>
): void {
    // Add entity token
    const pid = AttributeInfo.pidFromKey(item.key);
    tokens.add(lexer.getEntityToken(pid));

    // Add attribute tokens
    for (const aid of attributes.getAttributes(item.key)) {
        tokens.add(lexer.getAttributeToken(aid));
    }

    // Add child item tokens.
    for (const child of item.children) {
        addTokens(attributes, lexer, child, tokens);
    }
}

function createSubgraph(
    tokenizer: Tokenizer,
    edgeLists: Edge[][],
    subset: Set<Token>,
    span: Span
): Graph {
    const filtered: Edge[][] = [];
    for (const [i, edgeList] of edgeLists.entries()) {
        if (i >= span.start && i < span.start + span.length) {
            // Only copy edgelists that are within the span
            filtered.push(edgeList.filter(edge => {
                const token = tokenizer.tokenFromEdge(edge);
    
                if (token.type === ENTITY || token.type === ATTRIBUTE) {
                    // Entities (products and options) and Attributes
                    // are copied if they are in the subset.
                    return subset.has(token);
                } else if (token.type !== UNKNOWNTOKEN) {
                    // All other, non-default edges are copied.
                    // The default edges will be added by the DynamicGraph constructor.
                    // TODO: REVIEW: do UNKNOWNTOKEN only correspond to default edges?
                    // Can they be anything else?
                    return true;
                } else {
                    return false;
                }
            }));    
        }
    }
    return new DynamicGraph(filtered);
}


///////////////////////////////////////////////////////////////////////////////
//
// Generating targets
//
///////////////////////////////////////////////////////////////////////////////

// TODO: ISSUE: does this return an iterator of HypotheticalItems,
// correponding to ItemInstances in the cart for one Interpretation,
// or for all Interpretations? Issue is that one doesn't want to see
// the same item twice. Is the solution to collect the ItemInstances
// in a Set? This seems wrong because in the case of, say, a remove
// operation with two Interpretations, one want to remove only one
// target.
//
// TODO: a target might also be implicit, if the tokens don't contain
// an entity.
//
// TODO: remove an option from an implicit entity - e.g. 'I removed the decaf'
// TODO: remove an attribute from an implicit entity - e.g. 'I removed the large` - doesn't make sense
// Seems you can change/modify an attribute, but not remove it.
export function *targets(
    attributes: AttributeInfo,
    cartOps: ICartOps,
    lexer: LexicalAnalyzer,
    rules: IRuleChecker,
    state: State,
    tokenization: Tokenization,
    // tokens: Array<SequenceToken & Span>,
    // graph: Graph
): IterableIterator<HypotheticalItem> {
    const tokens = tokenization.tokens;
    const graph = tokenization.graph;
    const cart = state.cart;

    //
    // Construct lexical subgraph corresponding to items in the cart.
    //

    // Subgraph span will be that of `tokens`.
    const last = tokens[tokens.length - 1];
    const span: Span = {
        start: tokens[0].start,
        length: last.start + last.length
    };

    // Subgraph edges will correspond to tokens for items in `cart`.
    const subgraph = subgraphFromItems(attributes, lexer, cart, graph, span);
    
    // Try each tokenization of the subgraph
    const tokenizations = lexer.tokenizationsFromGraph2(subgraph);
    for (const tokenization of tokenizations) {
        const {entities, gaps} = splitOnEntities(tokenization.tokens as SequenceToken[]);
        const segment: Segment = {
            left: gaps[0],
            entity: entities[0],
            right: gaps[1]
        };

        const builder = new EntityBuilder(segment, cartOps, attributes, rules);
        const target = builder.getItem();

        if (target !== undefined) {
            console.log(`============ Hypothetical target ${target.key} ==============`);
            // Yield matching ItemInstances from the cart.
            // TODO: we need a predicate that treats unspecified attributes as wildcards.
            // Need to know whether an attribute is default because it was omitted or
            // specified as the default value.
            // Perhaps EntityBuilder needs a wildcard mode.
            for (const item of cartOps.findByKey(state.cart, target.key)) {
                yield {
                    item,
                    score: builder.getScore()
                };
            }
        }
    }
}


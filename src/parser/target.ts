import {
    AttributeInfo,
    Cart,
    ICartOps,
    ICatalog,
    IRuleChecker,
    ItemInstance,
    OPTION,
    State,
} from 'prix-fixe';

import {
    DynamicGraph,
    Edge,
    Graph,
    Token,
    Tokenizer,
    UNKNOWNTOKEN
} from 'token-flow';

import {
    ATTRIBUTE,
    ENTITY,
    LexicalAnalyzer,
    Span,
    tokenToString,
} from '../lexer';

import { EntityBuilder } from './entity_builder';
import { HypotheticalItem, SequenceToken, Segment } from './interfaces';
import { Parser } from './parser';
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

                if (token.type === ENTITY || token.type === OPTION || token.type === ATTRIBUTE) {
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

    // console.log('Filtered graph:');
    // for (const [i, edges] of filtered.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = tokenToString(tokenizer.tokenFromEdge(edge));
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
    //     }
    // }

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
    parser: Parser,
    state: State,
    graph: Graph,
    span: Span
): IterableIterator<HypotheticalItem> {
    const attributes: AttributeInfo = parser.attributes;
    const cartOps: ICartOps = parser.cartOps;
    const catalog: ICatalog = parser.catalog;
    const lexer: LexicalAnalyzer = parser.lexer;
    const rules: IRuleChecker = parser.rules;
    const cart = state.cart;

    if (span.length === 0) {
        return;
    }

    //
    // Construct lexical subgraph corresponding to items in the cart.
    // Subgraph edges will correspond to tokens for items in `cart`.
    //
    const subgraph = subgraphFromItems(attributes, lexer, cart, graph, span);
    
    // Try each tokenization of the subgraph.
    // Need to look at all tokenizations, not just the top-scoring ones because
    // targets are often partially/poorly specified (e.g. "latte" instead of
    // "cinnamon dolce latte")
    const tokenizations = lexer.allTokenizations(subgraph);
    for (const tokenization of tokenizations) {
        // console.log('Tokenization:');
        // for (const token of tokenization) {
        //     const text = tokenToString(token);
        //     console.log(`  ${text}, start=${token.start}, length=${token.length}`);
        // }

        const {entities, gaps} =
            splitOnEntities(tokenization as Array<SequenceToken & Span>);
        if (entities.length > 0) {
            const segment: Segment = {
                left: gaps[0],
                entity: entities[0].pid,
                right: gaps[1]
            };

            const builder = new EntityBuilder(
                segment,
                parser,
                true,
                true);
            const target = builder.getItem();

            // console.log(`  score: ${builder.getScore()}`);

            if (target !== undefined) {
                // console.log(`============ Hypothetical target ${target.key} ==============`);

                // Yield matching ItemInstances from the cart.
                // TODO: we need a predicate that treats unspecified attributes as wildcards.
                // Need to know whether an attribute is default because it was omitted or
                // specified as the default value.
                // Perhaps EntityBuilder needs a wildcard mode.
                for (const item of cartOps.findByKeyRegex(state.cart, target.key)) {
                    yield {
                        item,
                        score: builder.getScore()
                    };
                }
            }
        }
    }
}


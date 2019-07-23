import {
    DynamicGraph,
    Edge,
    Graph,
    Token,
    Tokenizer,
    UNKNOWNTOKEN
} from 'token-flow';

import { Cart, ItemInstance, AttributeInfo } from 'prix-fixe';

import {
    ATTRIBUTE,
    ENTITY,
    LexicalAnalyzer,
    Span
} from '../lexer';

export function subgraphFromItems(
    attributes: AttributeInfo,
    lexer: LexicalAnalyzer,
    cart: Cart,
    // TODO: do we want to take a Graph, or Tokenization, or TokenX[], or Edge[][]?
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

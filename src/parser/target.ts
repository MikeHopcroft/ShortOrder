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
    LexicalAnalyzer
} from '../lexer';

function subgraphFromItems(
    attributes: AttributeInfo,
    lexer: LexicalAnalyzer,
    cart: Cart,
    graph: Graph
): Graph {
    const tokens = new Set<Token>();
    for (const item of cart.items) {
        addTokens(attributes, lexer, item, tokens);
    }

    return createSubgraph(lexer.tokenizer, graph.edgeLists, tokens);
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
    subset: Set<Token>
): Graph {
    const filtered: Edge[][] = [];
    for (const edgeList of edgeLists) {
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
    return new DynamicGraph(filtered);
}

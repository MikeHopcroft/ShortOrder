import { State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    createSpan,
    PROLOGUE,
    REMOVE_ITEM,
    Span,
    PREPOSITION
} from '../lexer';

import {
    Interpretation,
    nop,
    PRODUCT_PARTS_1,
    PRODUCT_PARTS_N,
    ProductToken,
} from './interfaces';

import { Parser } from './parser';
import { targets } from './target';
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product remove operation.
//
// Assumes that `tokens` starts with:
//     [PROLOGUE] REMOVE_ITEM (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
export function processRemove(
    parser: Parser,
    state: State,
    tokens: TokenSequence<Token & Span>,
    graph: Graph,
): Interpretation {
    if (tokens.peek(0).type === PROLOGUE) {
        tokens.take(1);
    }
    if (tokens.peek(0).type === REMOVE_ITEM) {
        tokens.take(1);
    }

    if (!tokens.atEOS()) {
        const token = tokens.peek(0);
        if (token.type === PRODUCT_PARTS_1 || token.type === PRODUCT_PARTS_N) {
            const parts = token as ProductToken & Span;
            tokens.take(1);
            const span = createSpan(parts.tokens);
            return parseRemove(parser, state, graph, span);
        } else if (token.type === PREPOSITION) {
            // TODO: add a test to exercise this case.
            // Does it ever happen? It may be that the REMOVE_ITEM
            // aliases always include a PREPOSITION.
            tokens.take(1);
            return parseRemoveImplicit(parser, state);
        }
    } else {
        return parseRemoveImplicit(parser, state);
    }

    return nop;
}

function parseRemove(
    parser: Parser,
    state: State,
    graph: Graph,
    span: Span
): Interpretation {
    let interpretation: Interpretation = nop;

    for (const target of targets(
        parser,
        state,
        graph,
        span
    )) {
        if (target.score > interpretation.score) {
            const item = target.item!;
            interpretation = {
                score: target.score,
                items: [target.item!],
                action: (state: State): State => {
                    const cart = parser.cartOps.removeFromCart(
                        state.cart,
                        item.uid
                    );
                    return {...state, cart};
                }
            };
        }
    }

    return interpretation;
}

function parseRemoveImplicit(parser: Parser, state: State): Interpretation {
    return {
        score: 1,
        items: [],
        action: (state: State): State => {
            let cart = state.cart;
            const count = cart.items.length;
            if (count > 0) {
                const last = cart.items[count - 1];
                cart = parser.cartOps.removeFromCart(cart, last.uid);
                return {...state, cart };
            } else {
                return state;
            }
        }
    };
}

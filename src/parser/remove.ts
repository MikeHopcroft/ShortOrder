import { State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    createSpan,
    PROLOGUE,
    REMOVE_ITEM,
    Span
} from '../lexer';

import {
    Interpretation,
} from './interfaces';
import { Parser } from './parser';
import { nop } from './parser_utilities';
import { takeActiveTokens } from './root';
import { targets } from './target';
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product remove operation.
//
// Assumes that `tokens` starts with:
//     [PROLOGUE] REMOVE_ITEM PRODUCT_PARTS [EPILOGUE]
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
    const active = takeActiveTokens(parser, tokens);
    const span = createSpan(active);
    return parseRemove(parser, state, graph, span);
}

function parseRemove(
    parser: Parser,
    state: State,
    graph: Graph,
    span: Span
): Interpretation {
    const interpretation: Interpretation = {
        score: 0,
        items: [],
        action: nop
    };

    for (const target of targets(
        parser.attributes,
        parser.cartOps,
        parser.lexer,
        parser.rules,
        state,
        graph,
        span
    )) {
        if (target.score > interpretation.score) {
            const item = target.item!;
            interpretation.score = target.score;
            interpretation.items = [target.item!];
            interpretation.action = (state: State): State => {
                const cart = parser.cartOps.removeFromCart(state.cart, item.uid);
                return {...state, cart};
            };
        }
    }

    return interpretation;
}

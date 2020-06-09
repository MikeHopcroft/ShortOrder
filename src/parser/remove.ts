import { Cart, State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    createSpan,
    PROLOGUE,
    REMOVE_ITEM,
    Span,
    PREPOSITION,
    tokenToString
} from '../lexer';

import {
    Interpretation,
    nop,
    PRODUCT_PARTS_1,
    PRODUCT_PARTS_N,
    ProductToken,
    PRODUCT_PARTS_0,
} from './interfaces';

import { Parser } from './parser';
import { optionTargets, productTargets } from './target';
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
        } else if (tokens.startsWith([
            // PREPOSITION,
            PRODUCT_PARTS_0,
            PREPOSITION,
            PRODUCT_PARTS_1
        ])) {
            // console.log('remove OPTION from TARGET');
            const option = tokens.peek(0) as ProductToken & Span;
            const target = tokens.peek(2) as ProductToken & Span;
            tokens.take(3);
            return parseRemoveOptionFromTarget(parser, state, graph, option, target);
        } else if (token.type === PRODUCT_PARTS_0) {
            console.log('remove OPTION from IMPLICIT (1)');
            const parts = token as ProductToken & Span;
            tokens.take(1);
            return parseRemoveOptionFromImplicit(parser, state, parts);
        } else if (token.type === PREPOSITION) {
            // TODO: add a test to exercise this case.
            // Does it ever happen? It may be that the REMOVE_ITEM
            // aliases always include a PREPOSITION.
            tokens.take(1);
            return parseRemoveImplicit(parser, state);
        } else if (tokens.startsWith([
            PREPOSITION,
            PRODUCT_PARTS_0
        ])) {
            console.log('remove OPTION from IMPLICIT (2)');
            const parts = tokens.peek(1) as ProductToken & Span;
            tokens.take(2);
            return parseRemoveOptionFromImplicit(parser, state, parts);
        }
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

    for (const target of productTargets(
        parser,
        state,
        graph,
        span
    )) {
        if (target.score > interpretation.score) {
            const item = target.item!;
            interpretation = {
                score: target.score,
                tokenCount2: span.length,
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
        tokenCount2: 0,
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

function parseRemoveOptionFromImplicit(
    parser: Parser,
    state: State,
    parts: ProductToken & Span
): Interpretation {
    console.log('parseRemoveOptionFromImplicit() not implemented.');
    // Instead of getting filtering graph with cart, want to filter with target item instance.
    // In this implicit case, target item instance is last item in the cart.
    return nop;
}


function parseRemoveOptionFromTarget(
    parser: Parser,
    state: State,
    graph: Graph,
    optionTokens: ProductToken & Span,
    targetTokens: ProductToken & Span,
): Interpretation {
    // console.log('parseRemoveOptionFromTarget() not implemented.');
    // Instead of getting filtering graph with cart, want to filter with target item instance.
    // In this implicit case, target item instance is last item in the cart.

    const optionSpan = createSpan(optionTokens.tokens);
    const targetSpan = createSpan(targetTokens.tokens);
    let interpretation: Interpretation = nop;

    for (const targetInterpretation of productTargets(
        parser,
        state,
        graph,
        targetSpan
    )) {
        if (targetInterpretation.item) {
            // For this target, interpret the option tokens relative to
            // a cart with only the target.

            // ISSUE: do we also score option interpretations?
            // TODO: need some way to get targets of options only.
            // TODO: need some way to build and return option targets.
            for (const optionInterpretation of optionTargets(
                parser,
                targetInterpretation.item,
                graph,
                optionSpan
            )) {
                const score =
                    targetInterpretation.score + optionInterpretation.score;
                const tokenCount2 =
                    targetInterpretation.tokenCount + optionInterpretation.tokenCount;
                // console.log(`score = ${score}`);
                if (score > interpretation.score && optionInterpretation.item) {
                    interpretation = {
                        score,
                        tokenCount2,
                        action: (state: State): State => {
                            const cart = parser.cartOps.removeFromCart(
                                state.cart,
                                optionInterpretation.item!.uid
                            );
                            return {...state, cart};
                        }
                    };
                }
            }
        }
    }

    return interpretation;
}

import { State } from 'prix-fixe';

import {
    Tokenization
} from '../lexer';

import {
    Interpretation,
} from './interfaces';

import { targets } from './target';
import { Parser } from './parser';
import { nop } from './parser_utilities';

export function parseRemove(
    parser: Parser,
    state: State,
    tokenization: Tokenization
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
        tokenization
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

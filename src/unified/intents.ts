import { Item, Token } from 'token-flow';

export const ADD_TO_ORDER: unique symbol = Symbol.for('ADD_TO_ORDER');
export type ADD_TO_ORDER = typeof ADD_TO_ORDER;

export const ANSWER_AFFIRMATIVE: unique symbol = Symbol.for('ANSWER_AFFIRMATIVE');
export type ANSWER_AFFIRMATIVE = typeof ANSWER_AFFIRMATIVE;

export const ANSWER_NEGATIVE: unique symbol = Symbol.for('ANSWER_NEGATIVE');
export type ANSWER_NEGATIVE = typeof ANSWER_NEGATIVE;

export const CANCEL_LAST_ITEM: unique symbol = Symbol.for('CANCEL_LAST_ITEM');
export type CANCEL_LAST_ITEM = typeof CANCEL_LAST_ITEM;

export const CANCEL_ORDER: unique symbol = Symbol.for('CANCEL_ORDER');
export type CANCEL_ORDER = typeof CANCEL_ORDER;

export const CONJUNCTION: unique symbol = Symbol.for('CONJUNCTION');
export type CONJUNCTION = typeof CONJUNCTION;

export const END_OF_ORDER: unique symbol = Symbol.for('END_OF_ORDER');
export type END_OF_ORDER = typeof END_OF_ORDER;

export const NEED_MORE_TIME: unique symbol = Symbol.for('NEED_MORE_TIME');
export type NEED_MORE_TIME = typeof NEED_MORE_TIME;

export const PREPOSITION: unique symbol = Symbol.for('PREPOSITION');
export type PREPOSITION = typeof PREPOSITION;

export const REMOVE_ITEM: unique symbol = Symbol.for('REMOVE_ITEM');
export type REMOVE_ITEM = typeof REMOVE_ITEM;

export const RESTATE: unique symbol = Symbol.for('RESTATE');
export type RESTATE = typeof RESTATE;

export const SALUTATION: unique symbol = Symbol.for('SALUTATION');
export type SALUTATION = typeof SALUTATION;

export const SEPERATOR: unique symbol = Symbol.for('SEPERATOR');
export type SEPERATOR = typeof SEPERATOR;

export const SUBSTITUTE: unique symbol = Symbol.for('SUBSTITUTE');
export type SUBSTITUTE = typeof SUBSTITUTE;

export function intentTokenFactory(item:Item): Token {
    let name = "UNKNOWN";
    if (item) {
        name = item.name;
    }
    const symbol = Symbol.for(name);
    return { type: symbol };
}

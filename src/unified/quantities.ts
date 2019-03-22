import { Item, Token } from 'token-flow';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends Token {
    type: QUANTITY;
    value: number;
}

export function quantityTokenFactory(item:Item): Token {
    return { type: QUANTITY, value: item.pid } as QuantityToken;
}

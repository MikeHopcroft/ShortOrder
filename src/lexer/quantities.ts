import { Item, Token, NUMBERTOKEN, NumberToken } from 'token-flow';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends Token {
  type: QUANTITY;
  value: number;
}

export function quantityTokenFactory(item: Item): Token {
  return { type: QUANTITY, value: item.pid } as QuantityToken;
}

export function createQuantity(value: number) {
  return { type: QUANTITY, value } as QuantityToken;
}

export function createNumber(value: number) {
  return { type: NUMBERTOKEN, value } as NumberToken;
}

import { Item, PID, Token } from 'token-flow';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    id: PID;
    name: string;
}

export function attributeTokenFactory(item:Item): Token {
    return { type: ATTRIBUTE, id: item.pid, name: item.name } as AttributeToken;
}

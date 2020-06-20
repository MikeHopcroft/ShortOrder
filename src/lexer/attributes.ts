import { PID } from 'prix-fixe';
import { Token } from 'token-flow';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    id: PID;
    name: string;
}

export function createAttribute(id: PID, name: string) {
    return { type: ATTRIBUTE, id, name } as AttributeToken;
}

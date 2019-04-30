import { Item, PID, Token } from 'token-flow';

export const OPTION: unique symbol = Symbol('OPTION');
export type OPTION = typeof OPTION;

export interface OptionToken extends Token {
    type: OPTION;
    id: PID;
    name: string;
}

export function optionTokenFactory(item: Item): Token {
    return { type: OPTION, id: item.pid, name: item.name } as OptionToken;
}

export function CreateOption(id: PID, name: string) {
    return { type: OPTION, id, name } as OptionToken;
}

import { Item, PID, Token } from 'token-flow';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    pid: PID;
    name: string;
}

export function entityTokenFactory(item:Item): Token {
    return { type: ENTITY, pid: item.pid, name: item.name } as EntityToken;
}

export function CreateEntity(pid: PID, name: string) {
    return { type: ENTITY, pid, name } as EntityToken;
}

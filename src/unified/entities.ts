import { Item, PID, Token } from 'token-flow';
import { CreateOption } from './options';
import { ItemDescription } from '../catalog';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    pid: PID;
    name: string;
}

export function entityTokenFactory(item: Item): Token {
    if ((item as ItemDescription).isOption) {
        return CreateOption(item.pid, item.name);
    }
    else {
        return CreateEntity(item.pid, item.name);
    }
}

export function CreateEntity(pid: PID, name: string) {
    return { type: ENTITY, pid, name } as EntityToken;
}

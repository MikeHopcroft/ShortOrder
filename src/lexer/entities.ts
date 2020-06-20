import { PID } from 'prix-fixe';
import { Token } from 'token-flow';

import { ProductRecipeToken } from './cookbook';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    pid: PID;
    name: string;
}

export function createEntity(pid: PID, name: string) {
    return { type: ENTITY, pid, name } as EntityToken;
}

export type AnyProductToken = EntityToken | ProductRecipeToken;
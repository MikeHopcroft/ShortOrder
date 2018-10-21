import { PID } from './types';

export const UNKNOWN: unique symbol = Symbol('UNKNOWN');
export type UNKNOWN = typeof UNKNOWN;

export interface Token {
    type: symbol;
    text: string;
}

export interface UnknownToken extends Token {
    type: UNKNOWN;
    text: string;
}

export type TokenFactory<T> = (pid: PID, text: string) => T;

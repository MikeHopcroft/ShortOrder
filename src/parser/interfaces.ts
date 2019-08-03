import { ItemInstance, PID, State } from 'prix-fixe';
import { NumberToken, Token } from 'token-flow';

import {
    AttributeToken,
    CONJUNCTION,
    EntityToken,
    OptionToken,
    Span,
    UnitToken,
} from '../lexer';

export interface ConjunctionToken extends Token {
    type: CONJUNCTION;
}

// A seqeunce of SequenceToken that does not include any ENTITY tokens.
export const PRODUCT_PARTS_0: unique symbol = Symbol('PRODUCT_PARTS_0');
export type PRODUCT_PARTS_0 = typeof PRODUCT_PARTS_0;
export interface ProductToken0 extends Token {
    type: PRODUCT_PARTS_0;
    tokens: Array<SequenceToken & Span>;
}

// A seqeunce of SequenceToken that does not include exactly one ENTITY token.
export const PRODUCT_PARTS_1: unique symbol = Symbol('PRODUCT_PARTS_1');
export type PRODUCT_PARTS_1 = typeof PRODUCT_PARTS_1;
export interface ProductToken1 extends Token {
    type: PRODUCT_PARTS_1;
    tokens: Array<SequenceToken & Span>;
}

// A seqeunce of SequenceToken that does not include two or more ENTITY tokens.
export const PRODUCT_PARTS_N: unique symbol = Symbol('PRODUCT_PARTS_N');
export type PRODUCT_PARTS_N = typeof PRODUCT_PARTS_N;
export interface ProductTokenN extends Token {
    type: PRODUCT_PARTS_N;
    tokens: Array<SequenceToken & Span>;
}

export type ProductToken =
    ProductToken0 |
    ProductToken1 |
    ProductTokenN;

export type SequenceToken = 
    AttributeToken |
    ConjunctionToken |
    EntityToken |
    OptionToken |
    NumberToken |
    UnitToken;

export type GapToken = 
    AttributeToken |
    ConjunctionToken |
    OptionToken |
    NumberToken |
    UnitToken;

export interface Segment {
    left: GapToken[];
    entity: PID;
    right: GapToken[];
}

export interface HypotheticalItem {
    score: number;
    item: ItemInstance | undefined;
}

export type ActionFunction = (state: State) => State;

export interface Interpretation {
    score: number;
    items: ItemInstance[];
    action: ActionFunction;
}

// An interpretation that does not modify state.
export const nop: Interpretation = {
    score: 0,
    items: [],
    action: (state: State): State => state
};


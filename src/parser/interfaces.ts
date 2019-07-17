import { ItemInstance, State } from 'prix-fixe';
import { NumberToken, Token } from 'token-flow';

import {
    AttributeToken,
    CONJUNCTION,
    EntityToken,
    OptionToken,
    Span,
    TokenX,
    UnitToken,
} from '../lexer';

export interface ConjunctionToken extends Token {
    type: CONJUNCTION;
}

export const PRODUCT_PARTS: unique symbol = Symbol('PRODUCT_PARTS');
export type PRODUCT_PARTS = typeof PRODUCT_PARTS;
export interface ProductToken extends Token {
    type: PRODUCT_PARTS;
    tokens: Array<SequenceToken & Span>;
}

export const PRODUCT_PARTS_X: unique symbol = Symbol('PRODUCT_PARTS_X');
export type PRODUCT_PARTS_X = typeof PRODUCT_PARTS_X;
export interface ProductTokenX extends Token {
    type: PRODUCT_PARTS_X;
    tokens: TokenX[];
}

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
    entity: EntityToken;
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

import { ItemInstance } from 'prix-fixe';
import { NumberToken, Token } from 'token-flow';

import {
    AttributeToken,
    CONJUNCTION,
    EntityToken,
    OptionToken,
    UnitToken,
} from '../lexer';

export interface ConjunctionToken extends Token {
    type: CONJUNCTION;
}

export const PRODUCT_PARTS: unique symbol = Symbol('PRODUCT_PARTS');
export type PRODUCT_PARTS = typeof PRODUCT_PARTS;
export interface ProductToken extends Token {
    type: PRODUCT_PARTS;
    tokens: SequenceToken[];
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

export interface Interpretation {
    score: number;
    items: ItemInstance[];
}

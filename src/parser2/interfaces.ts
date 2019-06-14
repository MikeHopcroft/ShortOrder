import { ItemInstance } from 'prix-fixe';
import { NumberToken } from 'token-flow';

import {
    AttributeToken,
    EntityToken,
    OptionToken,
    UnitToken,
    CONJUNCTION,
} from '../unified';

export interface ConjunctionToken {
    type: CONJUNCTION;
}

export type SequenceToken = 
    AttributeToken |
    ConjunctionToken |
    EntityToken |
    OptionToken |
    NumberToken |
    UnitToken;

// TODO: conjunction token
export type GapToken = 
    AttributeToken |
    ConjunctionToken |
    EntityToken |
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

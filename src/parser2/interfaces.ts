import { ItemInstance } from 'prix-fixe';
import { NumberToken } from 'token-flow';

import {
    AttributeToken,
    EntityToken,
    OptionToken,
} from '../unified';

export type SequenceToken = 
    AttributeToken |
    EntityToken |
    OptionToken |
    NumberToken;

// TODO: conjunction token
export type GapToken = 
    AttributeToken |
    EntityToken |
    OptionToken |
    NumberToken;


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

import { PID } from 'token-flow';

import { IndexableItem } from '../catalog';

export interface AttributeItem extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    hidden?: boolean;
    isDefault?: boolean;
}

export interface DimensionDescription {
    did: PID;
    name: string;
    items: AttributeItem[];
}

export interface MatrixDescription {
    mid: PID;
    name: string;
    dimensions: PID[];
}

export interface Attributes {
    dimensions: DimensionDescription[];
    matrices: MatrixDescription[];
}

import { PID, Token } from 'token-flow';
import { AnyToken, ENTITY, EntityToken } from '../unified';
import { IndexableItem } from '../catalog';

export const MATRIXENTITY: unique symbol = Symbol('MATRIXENTITY');
export type MATRIXENTITY = typeof MATRIXENTITY;

export interface MatrixEntityToken extends Token {
    type: MATRIXENTITY;
    pid: PID;
    name: string;
}

export const ATTRIBUTE2: unique symbol = Symbol('v');
export type ATTRIBUTE2 = typeof ATTRIBUTE2;

type AxisId = number;

export interface AttributeToken2 extends Token {
    type: ATTRIBUTE2;
    pid: PID;
    axis: AxisId;
    name: string;
}

type AnyEntityToken = EntityToken | MatrixEntityToken;

export class MatrixEntity {
    constructor() {
    }

    trySetEntity(entity: AnyEntityToken): boolean {
        return false;
    }

    trySetAttribute(attribute: AnyToken): boolean {
        return true;
    }

    getPID(): PID {
        return 0;
    } 
}

interface AttributeItem extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    isDefault?: boolean;
}

interface Dimension {
    attributes: AttributeItem[];
}

interface AttributeValue {
    dimension: number;
    value: number;
}

export class AttributeMatrix {

    // Maps from attribute PID to dimension PID and numerical value.
    dimensions: number[];
    table: Map<PID, AttributeValue>;

    constructor(dimensions: IterableIterator<Dimension>) {
        this.dimensions = [];
        this.table = new Map<PID, AttributeValue>();

        let scale = 1;

        for (const d of dimensions) {
            const slot = this.dimensions.length;
            this.dimensions.push(d.attributes.length);

            let counter = 0;
            for (const a of d.attributes) {
                this.table.set(a.pid, {
                    dimension: slot,
                    value: scale * counter++});
            }

            scale *= d.attributes.length;
        }
    }

}


    // table: Map<AxisId, Set<PID>>;
    // dimensions: Map<PID, Dimension>;

    // constructor(attributes: IterableIterator<AttributeItem>) {
        // this.table = new Map<AxisId, Set<PID>>();

        // for (const attribute of attributes) {
        //     let axisAttributes = this.table.get(attribute.axis);
        //     if (axisAttributes) {
        //         axisAttributes.add(attribute.pid);
        //     }
        //     else {
        //         axisAttributes = new Set<PID>();
        //         axisAttributes.add(attribute.pid);
        //         this.table.set(attribute.axis, axisAttributes);
        //     }
        // }
    // }
    // if (this.dimensions.has(d.id)) {
    //     const message = `Found duplicate dimension id ${d.id}`;
    //     throw new TypeError(message);
    // }
    // this.dimensions.set(d.id, d);

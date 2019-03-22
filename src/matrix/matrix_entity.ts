import { PID, Token } from 'token-flow';
import { AnyToken, ENTITY, EntityToken } from '../unified';
import { IndexableItem, ItemDescription } from '../catalog';

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

export class MatrixEntityBuilder {
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

export class Dimension {
    id: PID;
    attributes: AttributeItem[];
    defaultAttribute: PID;

    constructor(id: PID, attributesIterator: IterableIterator<AttributeItem>) {
        this.id = id;
        this.attributes = [...attributesIterator[Symbol.iterator]()];
        if (this.attributes.length <= 1) {
            const message = `expect at least one attribute`;
            throw new TypeError(message);
        }

        let defaultAttribute: PID | undefined = undefined;
        for (const attribute of this.attributes) {
            if (attribute.isDefault === true) {
                if (defaultAttribute !== undefined) {
                    const message = `found second default attribute ${attribute.pid}`;
                    throw TypeError(message);
                }
                defaultAttribute = attribute.pid;
            }
        }

        if (defaultAttribute === undefined) {
            const message = `expected at least one default attribute`;
            throw TypeError(message);
        }

        this.defaultAttribute = defaultAttribute;
    }
}

interface AttributeCoordinate {
    dimension: Dimension;
    position: number;
}

export class Matrix {
    id: PID;

    constructor(id: PID, dimensions: PID[]) {
        this.id = id;
        // Allocate array of encoder scale factors.
        // Allocate array of Dimensions
    }
}

export class AttributeMatrix {
    readonly dimensionIdToDimension = new Map<PID, Dimension>();
    readonly attributeIdToCoordinate = new Map<PID, AttributeCoordinate>();
    readonly matrixIdToMatrix = new Map<PID, Matrix>();
    readonly entityIdToMatrix = new Map<PID, Matrix>();

    constructor() {
    }

    addDimension(dimension: Dimension) {
        if (this.dimensionIdToDimension.has(dimension.id)) {
            const message = `found duplicate dimension id ${dimension.id}.`;
            throw new TypeError(message);
        }
        this.dimensionIdToDimension.set(dimension.id, dimension);

        let position = 0;
        for (const attribute of dimension.attributes) {
            if (this.attributeIdToCoordinate.has(attribute.pid)) {
                const message = `found duplicate attribute pid ${attribute.pid}.`;
                throw new TypeError(message);    
            }
            this.attributeIdToCoordinate.set(attribute.pid, { dimension, position });
            position++;
        }
    }

    addMatrix(matrix: Matrix) {
        if (this.matrixIdToMatrix.has(matrix.id)) {
            const message = `found duplicate matrix id ${matrix.id}.`;
            throw new TypeError(message);
        }
        this.matrixIdToMatrix.set(matrix.id, matrix);
    }

    addEntity(entityId: PID, matrixId: PID) {
        if (this.entityIdToMatrix.has(entityId)) {
            const message = `found duplicate entity id ${entityId}.`;
            throw new TypeError(message);
        }
        const matrix = this.matrixIdToMatrix.get(matrixId);
        if (matrix) {
            this.entityIdToMatrix.set(entityId, matrix);
        }
        else {
            const message = `unknown matrix id ${matrixId}.`;
            throw new TypeError(message);
        }
    }

    getAttributeCoordinates(attributeId: PID): AttributeCoordinate | null {
        const coordinate = this.attributeIdToCoordinate.get(attributeId);
        return coordinate ? coordinate : null;
    }

    getMatrix(entityId: PID): Matrix | null {
        const matrix = this.entityIdToMatrix.get(entityId);
        return matrix ? matrix : null;
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

import { PID } from 'token-flow';

import { IndexableItem } from '../catalog';
import { Dimension } from './dimension';
import { Matrix } from './matrix';

export interface AttributeItem extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    isDefault?: boolean;
}

// The (dimension, position) coordinates of an attribute within a Matrix.
// Dimension corresponds to a characteristic like `size`.
// Position corresponds to a specific characteristic value such as `small`,
// 'medium`, or `large`.
export interface AttributeCoordinate {
    dimension: Dimension;
    position: number;
}

// Store information about the relationships between Attributes,
// Dimensions, and Matrices.
export class AttributeInfo {
    private readonly dimensionIdToDimension = new Map<PID, Dimension>();
    private readonly attributeIdToCoordinate = new Map<PID, AttributeCoordinate>();
    private readonly matrixIdToMatrix = new Map<PID, Matrix>();
    private readonly entityIdToMatrix = new Map<PID, Matrix>();
    private readonly keyToEntityId = new Map<number, PID>();

    constructor() {
    }

    // Indexes a Dimension and its Attributes.
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

    // Indexes a Matrix.
    addMatrix(matrix: Matrix) {
        if (this.matrixIdToMatrix.has(matrix.id)) {
            const message = `found duplicate matrix id ${matrix.id}.`;
            throw new TypeError(message);
        }
        this.matrixIdToMatrix.set(matrix.id, matrix);
    }

    // Associates an Entity with a specific Matrix.
    addGenericEntity(entityId: PID, matrixId: PID) {
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

    addSpecificEntity(entityId: PID, key: number) {
        if (this.keyToEntityId.has(key)) {
            const message = `found duplicate entity key ${key}.`;
            throw new TypeError(message);
        }
        this.keyToEntityId.set(key, entityId);
    }

    // Lookup an AttributeCoordinate by PID. The Coordinate provides the
    // Attribute's Dimension (e.g. size) and its Position in the Dimension
    // (e.g. 0 ==> small).
    getAttributeCoordinates(attributeId: PID): AttributeCoordinate | undefined {
        return this.attributeIdToCoordinate.get(attributeId);
    }

    // Lookup the Matrix that should be used to configure an Entity.
    getMatrix(entityId: PID): Matrix | undefined {
        return this.entityIdToMatrix.get(entityId);
    }

    // Returns the PID of an entity with a specific key.
    getPID(key: number): PID | undefined {
        return this.keyToEntityId.get(key);
    }
}

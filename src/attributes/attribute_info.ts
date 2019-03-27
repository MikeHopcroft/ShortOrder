import { PID } from 'token-flow';

import { Catalog } from '../catalog';

import { Dimension } from './dimension';
import { Attributes } from './interfaces';
import { Matrix } from './matrix';

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
    private readonly attributeIdToSKU = new Map<PID, PID>();
    private readonly matrixIdToMatrix = new Map<PID, Matrix>();
    private readonly entityIdToMatrix = new Map<PID, Matrix>();
    private readonly keyToEntityId = new Map<string, PID>();

    static factory(catalog: Catalog, attributes: Attributes): AttributeInfo {
        const info = new AttributeInfo();

        for (const dimension of attributes.dimensions) {
            info.addDimension(new Dimension(dimension.did, dimension.items.values()));
        }

        for (const matrix of attributes.matrices) {
            // TODO: check for bad/unknown `did`.
            const dimensions: Dimension[] = [];
            for (const did of matrix.dimensions) {
                const dimension = info.dimensionIdToDimension.get(did);
                if (!dimension) {
                    const message = `unknown dimension ${did}.`;
                    throw TypeError(message);
                }
                dimensions.push(dimension);
            }
            info.addMatrix(new Matrix(matrix.mid, dimensions));
        }

        for (const item of catalog.map.values()) {
            if (item.matrix) {
                info.addGenericEntity(item.pid, item.matrix);
            }
            else if (item.key) {
                info.addSpecificEntity(item.pid, item.key);
            }
        }

        return info;
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

            if (attribute.sku !== undefined) {
                if (this.attributeIdToSKU.has(attribute.sku)) {
                    const message = `found duplicate attribute pid ${attribute.pid}.`;
                    throw new TypeError(message);       
                }
                this.attributeIdToSKU.set(attribute.pid, attribute.sku);
            }
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

    addSpecificEntity(entityId: PID, key: string) {
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

    getAttributeSKU(attributeId: PID): PID | undefined {
        return this.attributeIdToSKU.get(attributeId);
    }

    getMatrix(matrixId: PID): Matrix | undefined {
        return this.matrixIdToMatrix.get(matrixId);
    }

    // Lookup the Matrix that should be used to configure an Entity.
    getMatrixForEntity(entityId: PID): Matrix | undefined {
        return this.entityIdToMatrix.get(entityId);
    }

    // Returns the PID of an entity with a specific key.
    getPID(key: string): PID | undefined {
        return this.keyToEntityId.get(key);
    }
}

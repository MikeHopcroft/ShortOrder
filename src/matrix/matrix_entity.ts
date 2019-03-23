import { PID } from 'token-flow';
import { AttributeToken, EntityToken } from '../unified';
import { IndexableItem } from '../catalog';

// TODO: concept of no attribute. e.g. diet coke vs coke

export interface AttributeItem extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    isDefault?: boolean;
}

// Represents a characteristic like size, color, or flavor.
// Each Dimension is associated with a number of attributes such as
// `small`, `medium` and `large`.
export class Dimension {
    readonly id: PID;
    readonly attributes: AttributeItem[];
    readonly defaultAttribute: PID;

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

// The (dimension, position) coordinates of an attribute within a Matrix.
// Dimension corresponds to a characteristic like `size`.
// Position corresponds to a specific characteristic value such as `small`,
// 'medium`, or `large`.
export interface AttributeCoordinate {
    dimension: Dimension;
    position: number;
}

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export class Matrix {
    readonly id: PID;
    readonly dimensions: Dimension[];
    readonly scales: number[];
    readonly counts: number[];

    constructor(id: PID, dimensions: Dimension[]) {
        this.id = id;
        this.dimensions = dimensions;

        this.counts = dimensions.map( (x) => x.attributes.length );

        this.scales = [];
        let scale = 1;
        for (const count of this.counts) {
            this.scales.push(scale);
            scale *= count;
        }
    }

    // Given a map from dimensionId to attributeId, return a number that
    // represents those set of attribute values associated Dimensions of
    // this Matrix.
    getKey(dimensionIdToAttribute: Map<PID, PID>, info: AttributeInfo): number {
        let key = 0;
        for (const [index, dimension] of this.dimensions.entries()) {
            let attributeId = dimensionIdToAttribute.get(dimension.id);
            if (attributeId === undefined) {
                attributeId = dimension.defaultAttribute;
            }
            const coordinate = info.getAttributeCoordinates(attributeId);
            if (!coordinate) {
                const message = `unknown attribute ${attributeId}.`;
                throw TypeError(message);
            }

            key += coordinate.position * this.scales[index];
        }

        return key;
    }
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
    getPid(key: number): PID | undefined {
        return this.keyToEntityId.get(key);
    }
}

// MatrixEntityBuilder collects Attribute and Entity values that will later be
// used to generate an Entity key which can be used to lookup the specific
// PID.
//
// For example, we might have a `cone` which is configured by `flavor` and
// `size` dimensions.
//
// Adding the entity `cone` and the attributes `small` and `chocolate` will
// allow us to generate a key which yields the PID for a `small chocolate cone`.
export class MatrixEntityBuilder {
    info: AttributeInfo;
    matrix: Matrix;

    entityId: PID | undefined = undefined;
    
    dimensionIdToAttribute = new Map<PID, PID>();

    constructor(info: AttributeInfo, matrix: Matrix) {
        this.info = info;
        this.matrix = matrix;
    }

    hasEntity(): boolean {
        return this.entityId !== undefined;
    }

    setEntity(entity: EntityToken) {
        if (this.entityId === undefined) {
            this.entityId = entity.pid;
            return true;
        }
        else {
            const message = `attempting to overwrite entity ${this.entityId} with ${entity.pid}`;
            throw TypeError(message);
        }
    }

    addAttribute(attribute: AttributeToken): boolean {
        const coordinate = this.info.getAttributeCoordinates(attribute.id);
        if (!coordinate) {
            const message = `unknown attribute ${attribute.id}.`;
            throw TypeError(message);
        }
        else if (this.dimensionIdToAttribute.has(coordinate.dimension.id)) {
            return false;
        }
        else {
            this.dimensionIdToAttribute.set(coordinate.dimension.id, attribute.id);
            return true;
        }
    }

    getPID(): PID | undefined {
        if (this.entityId === undefined) {
            const message = `no entity set`;
            throw TypeError(message);
        }

        const matrix = this.info.getMatrix(this.entityId);
        if (matrix === undefined) {
            // This entity does not need configuration.
            // Just return its id.
            return this.entityId;
        }

        const key = this.matrix.getKey(this.dimensionIdToAttribute, this.info);
        const pid = this.info.getPid(key);

        return pid;
    }
}

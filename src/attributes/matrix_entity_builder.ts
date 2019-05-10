import { PID } from 'prix-fixe';

import { AttributeToken, EntityToken, OptionToken } from '../unified';

import { AttributeInfo } from './attribute_info';
import { Matrix } from './matrix';


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
    private readonly info: AttributeInfo;

    private entityId: PID | undefined = undefined;
    
    private readonly dimensionIdToAttribute = new Map<PID, PID>();

    constructor(info: AttributeInfo) {
        this.info = info;
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

        const matrix = this.info.getMatrixForEntity(this.entityId);
        if (matrix === undefined) {
            // This entity does not need configuration.
            // Just return its id.
            return this.entityId;
        }

        const key = matrix.getKey(this.entityId, this.dimensionIdToAttribute, this.info);
        const pid = this.info.getPID(key);

        return pid;
    }

    // Iterator for PIDs of attributes that aren't associated with dimensions
    // of the entity's matrix. This includes all collected attributes in the
    // cases where the entity has not been set and where the entity is not
    // associated with a matrix.
    *getUnusedAttributes(): IterableIterator<PID> {
        let matrix: Matrix | undefined = undefined;

        // If we've collected an entity, attempt to get its matrix.
        if (this.entityId !== undefined) {
            matrix = this.info.getMatrixForEntity(this.entityId);
        }

        // If we didn't get a matrix (either no entity or entity didn't specify
        // a matrix), then create an empty matrix.
        if (!matrix) {
            matrix = new Matrix(0, []);
        }
        
        for (const [did, aid] of this.dimensionIdToAttribute.entries()) {
            if (!matrix.hasDimension(did)) {
                yield aid;
            }
        }
    }
}

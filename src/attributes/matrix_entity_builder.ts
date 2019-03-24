import { PID } from 'token-flow';

import { AttributeToken, EntityToken } from '../unified';

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

    getPID(): PID {
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

        if (pid === undefined) {
            const message = `no PID for key ${key}.`;
            throw TypeError(message);
        }

        return pid;
    }
}

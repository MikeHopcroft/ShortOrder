import { PID } from 'token-flow';

import { AttributeInfo } from './attribute_info';
import { Dimension } from './dimension';

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export class Matrix {
    readonly id: PID;
    readonly dimensions: Dimension[];

    constructor(id: PID, dimensions: Dimension[]) {
        this.id = id;
        this.dimensions = dimensions;
    }

    // Given a map from dimensionId to attributeId, return a number that
    // represents those set of attribute values associated Dimensions of
    // this Matrix.
    getKey(entityId: PID, dimensionIdToAttribute: Map<PID, PID>, info: AttributeInfo): string {
        const key = [entityId];
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

            key.push(coordinate.position);
        }

        return key.join(':');
    }
}

import { PID } from 'token-flow';

import { AttributeInfo } from './attribute_info';
import { Dimension } from './dimension';

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

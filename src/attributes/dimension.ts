import { PID } from 'token-flow';

import { AttributeItem } from './interfaces';

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

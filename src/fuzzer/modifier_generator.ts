import { Dimension } from '../attributes';
import { Generator } from './generator';
import { AnyInstance, CreateModifierInstance } from './instances';
import { aliasesFromOneItem } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// ModifierGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class ModifierGenerator implements Generator {
    private readonly dimension: Dimension;
    private readonly instances: AnyInstance[][];

    constructor(dimension: Dimension) {
        this.dimension = dimension;

        // First instance is the empty list, corresponding to the no modifier choice.
        this.instances = [[]];

        // Add remaining modifier choices.
        for (const modifier of this.dimension.attributes) {
            for (const alias of aliasesFromOneItem(modifier)) {
                this.instances.push([CreateModifierInstance(modifier.pid, alias)]);
            }
        }
    }

    count(): number {
        return this.instances.length;
    }
    
    version(id: number): AnyInstance[] {
        return this.instances[id];
    }
}

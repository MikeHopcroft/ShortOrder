import * as pluralize from 'pluralize';
import { PID, Token } from 'token-flow';

import { AttributeInfo, AttributeItem, Dimension, Matrix } from '../attributes';
import { ATTRIBUTE, ENTITY, OPTION } from '../unified';

export interface Instance {
    type: symbol;
    alias: string;
    // TODO: reinstate/implement version
    // version: number;
}

export const MODIFIER: unique symbol = Symbol('MODIFIER');
export type MODIFIER = typeof MODIFIER;

export interface AttributeInstance extends Instance {
    type: ATTRIBUTE;
    id: PID;
}

export function CreateAttribute(id: PID, alias: string): AttributeInstance {
    return { type: ATTRIBUTE, id, alias };
}

export interface EntityInstance extends Instance {
    type: ENTITY;
    id: PID;
}

export function CreateEntity(id: PID, alias: string): EntityInstance {
    return { type: ENTITY, id, alias };
}

export interface ModifierInstance extends Instance {
    type: MODIFIER;
    id: PID;
}

export function CreateModifier(id: PID, alias: string): ModifierInstance {
    return { type: MODIFIER, id, alias };
}

export interface OptionInstance extends Instance {
    type: OPTION;
    id: PID;

    quantity: number;
    quantifier?: string;
}

export function CreateOption(id: PID, alias: string, quantity: number, quantifier?: string): OptionInstance {
    return { type: OPTION, id, alias, quantity, quantifier };
}

type AnyInstance = 
    AttributeInstance |
    EntityInstance |
    ModifierInstance |
    OptionInstance;

interface CodedInstances {
    id: number;
    instances: AnyInstance[];
}

///////////////////////////////////////////////////////////////////////////////
//
// Pluralizer
//
///////////////////////////////////////////////////////////////////////////////
class Pluralizer {
    constructor(rules: Array<[RegExp, string]>) {
        for (const [pattern, replacement] of rules) {
            pluralize.addPluralRule(pattern, replacement);
        }
    }

    convert(word: string, count: number): string {
        return pluralize(word, count);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Generators
//
///////////////////////////////////////////////////////////////////////////////
interface Generator {
    versions(): IterableIterator<CodedInstances>;
    count(): number;
    version(id: number): AnyInstance[];
}

class ModifierGenerator implements Generator {
    private readonly dimension: Dimension;
    private readonly instances: AnyInstance[][];

    constructor(dimension: Dimension) {
        this.dimension = dimension;

        // First instance is the empty list, corresponding to the no modifier choice.
        this.instances = [[]];

        // Add remaining modifier choices.
        for (const modifier of this.dimension.attributes) {
            // TODO: generate aliases
            this.instances.push([CreateModifier(modifier.pid, modifier.aliases[0])]);
        }
    }

    *versions(): IterableIterator<CodedInstances> {
        for (const [id, instances] of this.instances.entries()) {
            yield { id, instances };
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): AnyInstance[] {
        return this.instances[id];
    }
}

// class OptionGenerator implements Generator {
//     private readonly pid: PID;
//     private readonly instances: AnyInstance[][];

//     // Aliases for units
//     // List of quantities
//     // Some way to specify omitted option vs removed option ('no anchovies', 'without').
//     constructor(pid: PID) {
//         this.pid = pid;
// // TODO        this.instances = [...this.versions()];
//     }

//     *versions(): IterableIterator<CodedInstances> {
//         for (const [id, instances] of this.instances.entries()) {
//             yield { id, instances };
//         }
//     }

//     count(): number {
//         return this.instances.length;
//     }

//     version(id: number): AnyInstance[] {
//         return this.instances[id];
//     }
// }

// class EntityGenerator implements Generator {
//     private readonly info: AttributeInfo;
//     private readonly entityId: PID;
//     private readonly matrix: Matrix;

//     private readonly dimensionIdToAttributeId = new Map<PID, PID>();
//     private readonly attributes: AttributeItem[] = [];

//     private readonly instances: AnyInstance[][];

//     constructor(attributeInfo: AttributeInfo, entityId: PID) {
//         this.info = attributeInfo;
//         this.entityId = entityId;
//         const matrix = this.info.getMatrixForEntity(this.entityId);
//         if (!matrix) {
//             const message = `Product ${entityId} does not have a matrix.`;
//             throw TypeError(message);
//         }
//         this.matrix = matrix;

//         this.instances = [...this.versions2()];
//     }

//     private pushAttribute(dimension: Dimension, attribute: AttributeItem) {
//         if (attribute.hidden !== true) {
//             this.attributes.push(attribute);
//         }
//         this.dimensionIdToAttributeId.set(dimension.id, attribute.pid);
//     }

//     private popAttribute(dimension: Dimension, attribute: AttributeItem) {
//         if (attribute.hidden !== true) {
//             this.attributes.pop();
//         }
//     }

//     private getPID(): PID | undefined {
//         const key = this.matrix.getKey(this.entityId, this.dimensionIdToAttributeId, this.info);
//         const pid = this.info.getPID(key);
//         return pid;
//     }

//     private *versions2(): IterableIterator<AnyInstance[]> {
//         yield* this.versionsRecursion(0);
//     }

//     private *versionsRecursion(d: number): IterableIterator<AnyInstance[]> {
//         const dimension = this.matrix.dimensions[d];
    
//         for (const attribute of dimension.attributes) {
//             this.pushAttribute(dimension, attribute);
    
//             if (d === this.matrix.dimensions.length - 1) {
//                 const pid = this.getPID();
//                 if (pid !== undefined) {
//                     yield [
//                         ...this.attributes.map(a => CreateAttribute(a.pid, a.name)),
//                         // TODO: need catalog to get alias
//                         // TODO: loop over generator for aliases
//                         CreateEntity(pid, alias)
//                     ];
//                 }
//             }
//             else {
//                 yield* this.versionsRecursion(d + 1);
//             }
    
//             this.popAttribute(dimension, attribute);
//         }
//     }

//     *versions(): IterableIterator<CodedInstances> {
//         for (const [id, instances] of this.instances.entries()) {
//             yield { id, instances };
//         }
//     }

//     count(): number {
//         return this.instances.length;
//     }

//     version(id: number): AnyInstance[] {
//         return this.instances[id];
//     }
// }

class QuantityGenerator {
    // TODO: undefined
    // TODO: no
    // TODO: a, some
    // TODO: one, two, three, . . .
}

// class ProductGenerator implements Generator {
//     private readonly generators;
//     private readonly instanceCount;

//     constructor(generators: Generator[]) {
//         this.generators = generators;
//     }

//     count(): number {
//         return this.instanceCount;
//     }

//     version(id: number): AnyInstance[] {
//         // decode id
//         // pass to each generator
//         // concatenate results
//     }
// }

export function factorial(n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    }
    else {
        return n * factorial(n - 1);
    }
}


export function permutation<T>(items: T[], lehmer: number) {
    const head: T[] = [];
    let tail = items;
    let code = lehmer;
    for (let divisor = items.length; divisor > 0; --divisor) {
        const index = code % divisor;
        // console.log(`code=${code}, divisor=${divisor}, index=${index}`);
        code = Math.floor(code / divisor);
        head.push(tail[index]);
        tail = [...tail.slice(0, index), ...tail.slice(index + 1)];
    }
    return head;
}

class PermutedGenerator implements Generator {
    private readonly intances: AnyInstance[];
    private readonly permutationCount: number;

    constructor(instances: AnyInstance[]) {
        this.intances = instances;
        this.permutationCount = factorial(instances.length);
    }

    *versions(): IterableIterator<CodedInstances> {
        for (let id = 0; id < this.permutationCount; ++id) {
            yield { id, instances: this.version(id) };
        }
    }

    count(): number {
        return this.permutationCount;
    }

    version(id: number): AnyInstance[] {
        return permutation(this.intances, id);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Renderers
//
///////////////////////////////////////////////////////////////////////////////
function renderAsText(instanes: AnyInstance[]): string {
    // insert 'with' before first option after entity.
    // special case 'with no' can also be 'no'
    // insert 'and' between last two options.
    // choose between 'a' and 'an'. Perhaps this should be in the option generator.
    // pluralize units and options. Perhaps this should be in the option generator.
    return "NOT IMPLEMENTED";
}

// function renderAsTestCase(instanes: AnyInstance[]): TestCase {
// }

///////////////////////////////////////////////////////////////////////////////
//
// Id encoder/decoder
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
// Permuter
//
///////////////////////////////////////////////////////////////////////////////

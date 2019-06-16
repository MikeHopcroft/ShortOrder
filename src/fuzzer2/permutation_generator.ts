import { Generator } from './generator';
import { factorial, permutation } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// PermutedGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class PermutationGenerator<T> implements Generator<T> {
    private readonly instances: T[];
    private readonly permutationCount: number;

    constructor(instances: T[]) {
        this.instances = instances;
        this.permutationCount = factorial(instances.length);
    }

    count(): number {
        return this.permutationCount;
    }

    version(id: number): T[] {
        return permutation(this.instances, id);
    }
}


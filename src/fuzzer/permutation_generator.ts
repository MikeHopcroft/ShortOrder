import { Generator } from './generator';
import { AnyInstance } from './instances';
import { factorial, permutation } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// PermutedGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class PermutationGenerator implements Generator {
    private readonly instances: AnyInstance[];
    private readonly permutationCount: number;

    constructor(instances: AnyInstance[]) {
        this.instances = instances;
        this.permutationCount = factorial(instances.length);
    }

    count(): number {
        return this.permutationCount;
    }

    version(id: number): AnyInstance[] {
        return permutation(this.instances, id);
    }
}


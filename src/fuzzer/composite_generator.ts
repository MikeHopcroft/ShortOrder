import { Generator } from './generator';
import { AnyInstance } from './instances';

///////////////////////////////////////////////////////////////////////////////
//
// CompositeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class CompositeGenerator implements Generator {
    private readonly generators: Generator[];
    private readonly instanceCount: number;

    constructor(generators: Generator[]) {
        this.generators = generators;

        let count = 1;
        for (const generator of generators) {
            count *= generator.count();
        }
        this.instanceCount = count;
    }

    count(): number {
        return this.instanceCount;
    }

    version(id: number): AnyInstance[] {
        let code = id;
        let instances: AnyInstance[] = [];
        for (const generator of this.generators) {
            const x = code % generator.count();
            code = Math.floor(code / generator.count());
            instances = instances.concat(generator.version(x));
        }
        return instances;
    }
}

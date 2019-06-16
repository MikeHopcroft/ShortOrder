import { Generator } from './generator';

///////////////////////////////////////////////////////////////////////////////
//
// CompositeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class CompositeGenerator<T> implements Generator<T> {
    private readonly generators: Array<Generator<T>>;
    private readonly instanceCount: number;

    constructor(generators: Array<Generator<T>>) {
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

    version(id: number): T[] {
        let code = id;
        let instances: T[] = [];
        for (const generator of this.generators) {
            const x = code % generator.count();
            code = Math.floor(code / generator.count());
            instances = instances.concat(generator.version(x));
        }
        return instances;
    }
}

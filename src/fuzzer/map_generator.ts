import { Generator } from './generator';

///////////////////////////////////////////////////////////////////////////////
//
// MapGenerator
//
///////////////////////////////////////////////////////////////////////////////
export type SequenceTransformer<T> = (instances: T[]) => T[];

export class MapGenerator<T> implements Generator<T> {
    private readonly generator: Generator<T>;
    private readonly transformers: Array<SequenceTransformer<T>>;

    constructor(generator: Generator<T>, transformers: Array<SequenceTransformer<T>>) {
        this.generator = generator;
        this.transformers = transformers;
    }

    count(): number {
        return this.generator.count();
    }

    version(id: number): T[] {
        let instances = this.generator.version(id);
        for (const transformer of this.transformers) {
            instances = transformer(instances);
        }
        return instances;
    }
}

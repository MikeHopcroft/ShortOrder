import { Generator } from './generator';
import { AnyInstance } from './instances';

///////////////////////////////////////////////////////////////////////////////
//
// MapGenerator
//
///////////////////////////////////////////////////////////////////////////////
export type InstanceSequenceTransformer = (instances: AnyInstance[]) => AnyInstance[];

export class MapGenerator implements Generator {
    private readonly generator: Generator;
    private readonly transformers: InstanceSequenceTransformer[];

    constructor(generator: Generator, transformers: InstanceSequenceTransformer[]) {
        this.generator = generator;
        this.transformers = transformers;
    }

    count(): number {
        return this.generator.count();
    }

    version(id: number): AnyInstance[] {
        let instances = this.generator.version(id);
        for (const transformer of this.transformers) {
            instances = transformer(instances);
        }
        return instances;
    }
}

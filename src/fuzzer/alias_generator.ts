import { generateAliases } from 'token-flow';

import { patternFromExpression } from '../unified';

import { Generator } from './generator';
import { CreateWordInstance, WordInstance } from './instances';

///////////////////////////////////////////////////////////////////////////////
//
// AliasGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AliasGenerator implements Generator<WordInstance> {
    private readonly instances: WordInstance[];

    constructor(aliases: string[]) {
        this.instances = [];
        for (const alias of aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of generateAliases(pattern)) {
                this.instances.push(CreateWordInstance(text));
            }
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): WordInstance[] {
        return [this.instances[id]];
    }
}

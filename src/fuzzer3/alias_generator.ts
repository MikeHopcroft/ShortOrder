import { generateAliases } from 'token-flow';

import { patternFromExpression } from '../unified';

import { WordX } from './fuzzer';
import { Random } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// AliasGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AliasGenerator {
    private readonly aliases: WordX[];

    constructor(aliases: string[]) {
        this.aliases = [];
        for (const alias of aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of generateAliases(pattern)) {
                this.aliases.push(new WordX(text));
            }
        }
    }

    randomAlias(random: Random): WordX {
        return random.randomChoice(this.aliases);
    }
}

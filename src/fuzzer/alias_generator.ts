import { generateAliases } from 'token-flow';

import { patternFromExpression } from '../lexer';

import { WordX } from './fuzzer';
import { Random } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// AliasGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AliasGenerator {
    private readonly segments: WordX[][];

    constructor(segments: string[][]) {
        this.segments = [];
        for (const segment of segments) {
            const aliases: WordX[] = [];
            for (const expression of segment) {
                const pattern = patternFromExpression(expression);
                for (const text of generateAliases(pattern)) {
                    aliases.push(new WordX(text));
                }
            }
            this.segments.push(aliases);
        }
    }

    randomAlias(random: Random): WordX[] {
        const segments: WordX[] = [];
        for (const segment of this.segments) {
            segments.push(random.randomChoice(segment));
        }
        return segments;
    }
}

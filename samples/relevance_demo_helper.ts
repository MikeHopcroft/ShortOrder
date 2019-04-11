import * as Debug from 'debug';
import * as fs from 'fs';
import { AggregatedResults, RelevanceSuite } from 'token-flow';

import { tokenToString, Unified, WORD, WordToken } from '../src/unified';

function unkownTokenFactory(terms: string[]) {
    return ({
        type: WORD,
        text: terms.join('_').toUpperCase()
    } as WordToken);
}

export function runRelevanceTest(
    entityFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifierFile: string,
    unitsFile: string,
    stopwordsFile: string,
    testFile: string,
    showPassedCases = false
): AggregatedResults {
    Debug.enable('tf-interactive,tf:*');

    const debugMode = false;
    const unified = new Unified(
        entityFile,
        intentsFile,
        attributesFile,
        quantifierFile,
        unitsFile,
        stopwordsFile,
        debugMode);

    // Blank line to separate console spew from unified constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    return suite.run(unified.lexicon, unified.tokenizer, tokenToString, unkownTokenFactory, showPassedCases);
}

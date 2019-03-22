import * as Debug from 'debug';
import * as fs from 'fs';
import { AggregatedResults, RelevanceSuite } from 'token-flow';

import { tokenToString } from '../src/unified';
import { Unified, WORD, WordToken } from '../src/unified';

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
    testFile: string,
    showPassedCases = false
    // stemmer: StemmerFunction = Tokenizer.defaultStemTerm
): AggregatedResults {
    Debug.enable('tf-interactive,tf:*');

    const debugMode = false;
    const unified = new Unified(
        entityFile,
        intentsFile,
        attributesFile,
        quantifierFile,
        debugMode);

    // Blank line to separate console spew from unified constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    return suite.run(unified.lexicon, unified.tokenizer, tokenToString, unkownTokenFactory, true);


    // const pipeline = new Pipeline(
    //     entityFile,
    //     intentsFile,
    //     attributesFile,
    //     quantifierFile,
    //     stemmer
    // );

    // // Blank line to separate console spew from pipeline constructor.
    // console.log();

    // const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    // return suite.run(pipeline.compositeRecognizer, tokenToString, showPassedCases);
}

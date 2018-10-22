import * as fs from 'fs';
import { Pipeline, tokenToString } from './pipeline';
import { AggregatedResults, RelevanceSuite } from '../src/relevance_suite';
import { StemmerFunction, Tokenizer } from '../src/tokenizer';

export function runRelevanceTest(
    entityFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifierFile: string,
    testFile: string,
    showPassedCases = false,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm
): AggregatedResults {
    const pipeline = new Pipeline(
        entityFile,
        intentsFile,
        attributesFile,
        quantifierFile,
        stemmer
    );

    // Blank line to separate console spew from pipeline constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    return suite.run(pipeline.compositeRecognizer, tokenToString, showPassedCases);
}

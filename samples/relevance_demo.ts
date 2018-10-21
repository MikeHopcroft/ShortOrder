import * as fs from 'fs';
import * as path from 'path';
import { Pipeline, tokenToString } from './pipeline';
import { AggregatedResults, RelevanceSuite } from '../src/relevance_suite';
import { StemmerFunction, Tokenizer } from '../src/tokenizer';

function runRelevanceTest(
    entityFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifierFile: string,
    testFile: string,
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
    return suite.run(pipeline.compositeRecognizer, tokenToString);
}

// This hacked stemmer exists solely to demonstrate pluggable stemmers.
function hackedStemmer(term: string): string {
    const lowercase = term.toLowerCase();
    if (lowercase === 'fries' || lowercase === 'fried') {
        return lowercase;
    }
    return Tokenizer.defaultStemTerm(lowercase);
}

export function relevanceDemo() {
    runRelevanceTest(
        path.join(__dirname, './data/menu.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/tests.yaml'),
        hackedStemmer);
}

export function relevanceDemoSpanish() {
    runRelevanceTest(
        path.join(__dirname, './data/Spanish/menu.yaml'),
        path.join(__dirname, './data/Spanish/intents.yaml'),
        path.join(__dirname, './data/Spanish/attributes.yaml'),
        path.join(__dirname, './data/Spanish/quantifiers.yaml'),
        path.join(__dirname, './data/Spanish/tests.yaml'),
        hackedStemmer);
}

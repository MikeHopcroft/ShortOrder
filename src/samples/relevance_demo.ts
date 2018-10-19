import * as path from 'path';
import { runRelevanceTest, RelevanceSuite } from '../relevance_test';
import { Tokenizer } from '../tokenizer';

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

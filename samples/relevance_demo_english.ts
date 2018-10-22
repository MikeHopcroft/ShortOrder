import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';
import { Tokenizer } from '../src/tokenizer';

// This hacked stemmer exists solely to demonstrate pluggable stemmers.
function hackedStemmer(term: string): string {
    const lowercase = term.toLowerCase();
    if (lowercase === 'fries' || lowercase === 'fried') {
        return lowercase;
    }
    return Tokenizer.defaultStemTerm(lowercase);
}

function relevanceDemo(showPassedCases = false) {
    runRelevanceTest(
        path.join(__dirname, './data/menu.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/tests.yaml'),
        showPassedCases,
        hackedStemmer);
}

relevanceDemo(true);

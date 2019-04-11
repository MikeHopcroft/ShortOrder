import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';

// // This hacked stemmer exists solely to demonstrate pluggable stemmers.
// function hackedStemmer(term: string): string {
//     const lowercase = term.toLowerCase();
//     if (lowercase === 'fries' || lowercase === 'fried') {
//         return lowercase;
//     }
//     return Tokenizer.defaultStemTerm(lowercase);
// }

function relevanceDemo(showPassedCases = false) {
    runRelevanceTest(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.txt'),
        path.join(__dirname, './data/restaurant-en/tests.yaml'),
        showPassedCases);
}

relevanceDemo(true);

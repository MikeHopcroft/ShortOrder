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

// runRelevanceTest(
//     './src/samples/data/menu.yaml',
//     './src/samples/data/intents.yaml',
//     './src/samples/data/attributes.yaml',
//     './src/samples/data/quantifiers.yaml',
//     './src/samples/data/tests.yaml',
//     hackedStemmer);

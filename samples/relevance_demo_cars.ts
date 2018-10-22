import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';
import { Tokenizer } from '../src/tokenizer';

function relevanceDemoCars(showPassedCases = false) {
    const suite = runRelevanceTest(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/cars/tests.yaml'),
        showPassedCases);
    return suite;    
}

relevanceDemoCars(true);


import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';

function relevanceDemoCars(showPassedCases = false) {
    const suite = runRelevanceTest(
        path.join(__dirname, './data/auto-dealer/catalog.yaml'),
        path.join(__dirname, './data/auto-dealer/intents.yaml'),
        path.join(__dirname, './data/auto-dealer/attributes.yaml'),
        path.join(__dirname, './data/auto-dealer/quantifiers.yaml'),
        path.join(__dirname, './data/auto-dealer/units.yaml'),
        path.join(__dirname, './data/auto-dealer/stopwords.txt'),
        path.join(__dirname, './data/auto-dealer/tests.yaml'),
        showPassedCases);
    return suite;    
}

relevanceDemoCars(true);


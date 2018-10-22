import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';

function relevanceDemoSpanish(showPassedCases = false) {
    runRelevanceTest(
        path.join(__dirname, './data/Spanish/menu.yaml'),
        path.join(__dirname, './data/Spanish/intents.yaml'),
        path.join(__dirname, './data/Spanish/attributes.yaml'),
        path.join(__dirname, './data/Spanish/quantifiers.yaml'),
        path.join(__dirname, './data/Spanish/tests.yaml'),
        showPassedCases);
}

relevanceDemoSpanish(true);

import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';

function relevanceDemoSpanish(showPassedCases = false) {
    runRelevanceTest(
        path.join(__dirname, './data/restaurant-es/menu.yaml'),
        path.join(__dirname, './data/restaurant-es/intents.yaml'),
        path.join(__dirname, './data/restaurant-es/attributes.yaml'),
        path.join(__dirname, './data/restaurant-es/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-es/units.yaml'),
        path.join(__dirname, './data/restaurant-es/tests.yaml'),
        showPassedCases);
}

relevanceDemoSpanish(true);

import {runRelevanceTest, RelevanceSuite} from '../relevance_test';

runRelevanceTest(
    './src/samples/data/menu.yaml',
    './src/samples/data/intents.yaml',
    './src/samples/data/attributes.yaml',
    './src/samples/data/quantifiers.yaml',
    './src/samples/data/tests.yaml');

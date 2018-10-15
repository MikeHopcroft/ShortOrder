import { Pipeline } from '../pipeline';

export function pipelineDemo(
    menuFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string,
    query: string
) {
    const pipeline = new Pipeline(menuFile, intentFile, attributesFile, quantifierFile);
    pipeline.processOneQuery(query);
}

pipelineDemo(
    './src/samples/data/menu.yaml',
    './src/samples/data/intents.yaml',
    './src/samples/data/attributes.yaml',
    './src/samples/data/quantifiers.yaml',
    // settings.SUBSET_MENU_FILE as string,
    // settings.INTENT_MENU_FILE as string,
    "I would like a Dakota burger with no onions extra pickles fries and a coke"
);

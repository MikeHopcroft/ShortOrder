import { Pipeline, printTokens } from '../pipeline';

export function pipelineDemo(
    menuFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string,
    query: string
) {
    const pipeline = new Pipeline(menuFile, intentFile, attributesFile, quantifierFile);
    const tokens = pipeline.processOneQuery(query);

    console.log(`"${query}"`);
    console.log();
    printTokens(tokens);
}

pipelineDemo(
    './src/samples/data/menu.yaml',
    './src/samples/data/intents.yaml',
    './src/samples/data/attributes.yaml',
    './src/samples/data/quantifiers.yaml',
//    'chicken sandwich with fries'
//    'chicken sandwich with fries'     // Broken - bug is the "fries" is on badwords list.
    "I would like a medium a Dakota burger with no onions extra pickles fries and a coke"
);

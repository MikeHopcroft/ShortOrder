import { Pipeline, printTokens } from '../pipeline';

export function pipelineDemo(
    menuFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string,
    query: string,
    debugMode = false
) {
    const pipeline = new Pipeline(
        menuFile,
        intentFile,
        attributesFile,
        quantifierFile,
        undefined,
        debugMode);

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
    'can I have two hamburgers',
    // 'chicken sandwich with fries',
    // 'chicken sandwich with fries' ,    // Broken - bug is the "fries" is on badwords list.
    // "I would like a medium a Dakota burger with no onions extra pickles fries and twenty three cokes",
    true);
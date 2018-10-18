import * as path from 'path';
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
    path.join(__dirname, './data/menu.yaml'),
    path.join(__dirname, './data/intents.yaml'),
    path.join(__dirname, './data/attributes.yaml'),
    path.join(__dirname, './data/quantifiers.yaml'),
    'can I have two hamburgers',
    // 'chicken sandwich with fries',
    // 'chicken sandwich with fries' ,    // Broken - bug is the "fries" is on badwords list.
    // "I would like a medium a Dakota burger with no onions extra pickles fries and twenty three cokes",
    true);
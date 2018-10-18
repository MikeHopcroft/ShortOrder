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

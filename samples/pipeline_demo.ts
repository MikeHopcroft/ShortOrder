import * as path from 'path';
import { Pipeline, printTokens } from '../src/pipeline';

function pipelineDemo(query: string, debugMode = false) {
    const pipeline = new Pipeline(
        path.join(__dirname, './data/restaurant-en/menu2.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        undefined,
        debugMode);

    const tokens = pipeline.processOneQuery(query);

    console.log(`"${query}"`);
    console.log();
    printTokens(tokens);
}

//const a = 'i want a chicken sandwich and some fries i want a big apple burger fried chicken breast and salmon';
const a = 'fried chicken breast';
pipelineDemo(a);
// pipelineDemo('can I have two hamburgers');

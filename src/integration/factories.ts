import * as path from 'path';

import {
    Processor,
    setup,
    World
} from 'prix-fixe';

import { createProcessor } from './processor';


export function createWorld(dataPath: string): World {
    const productsFile = path.join(dataPath, 'products.yaml');
    const optionsFile = path.join(dataPath, 'options.yaml');
    const attributesFile = path.join(dataPath, 'attributes.yaml');
    const rulesFile = path.join(dataPath, 'rules.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    return world;
}

export function createShortOrderProcessor(
    world: World,
    dataPath: string,
    debugMode: boolean
): Processor {
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const processor = createProcessor(
        world,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
        debugMode
    );

    return processor;
}

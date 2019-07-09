import * as path from 'path';

import {
    Processor,
    setup,
    State,
    World
} from 'prix-fixe';

import { LexicalAnalyzer } from '../lexer';
import { Parser } from '../parser';

export interface ShortOrderWorld extends World {
    lexer: LexicalAnalyzer;
    processor: Processor;
}

export function createShortOrderWorld(world: World, dataPath: string, debugMode: boolean): ShortOrderWorld {
    //
    // Set up short-order LexicalAnalyzer, Parser, and Processor.
    //
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const lexer = new LexicalAnalyzer(
        world,
        debugMode,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    const parser = new Parser(
        world.cartOps,
        world.attributeInfo,
        world.ruleChecker,
        debugMode);

    const processor = async (text: string, state: State): Promise<State> => {
        const interpretation = parser.parseRoot(lexer, text);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

    return {...world, lexer, processor};
}

export function createWorld(dataPath: string): World {
    const productsFile = path.join(dataPath, 'products.yaml');
    const optionsFile = path.join(dataPath, 'options.yaml');
    const attributesFile = path.join(dataPath, 'attributes.yaml');
    const rulesFile = path.join(dataPath, 'rules.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    return world;
}
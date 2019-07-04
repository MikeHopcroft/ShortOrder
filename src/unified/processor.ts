import { State, World } from 'prix-fixe';

import { ADD_TO_ORDER } from './intents';
import { LexicalAnalyzer } from './lexical_analyzer';
import { tokenToString } from './lexical_utilities';

// TODO: temporarily importing from parser2 directory because of export
// conflicts during refactor.
import { Parser2, SequenceToken } from '../parser2';


export function createProcessor(
    world: World,
    intentsFile: string,
    quantifiersFile: string,
    unitsFile: string,
    stopwordsFile: string,
    debugMode = false
) {
    const lexer = new LexicalAnalyzer(
        world,
        debugMode,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    const parser = new Parser2(world.cartOps, world.attributeInfo, world.ruleChecker);

    const processor = async (text: string, state: State): Promise<State> => {
        const interpretation = parser.parseRoot(lexer, text);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

    return processor;
}


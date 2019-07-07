import { State, World } from 'prix-fixe';

import { LexicalAnalyzer } from '../lexer';
import { Parser, SequenceToken } from '../parser';


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

    return processor;
}


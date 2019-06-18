import { State, World } from 'prix-fixe';

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
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
        false
    );

    const parser = new Parser2(world.cartOps, world.attributeInfo, world.ruleChecker);

    const processor = async (text: string, state: State): Promise<State> => {
        const tokens = lexer.processOneQuery(text);
        console.log(tokens.map(tokenToString).join(''));

        const interpretation = parser.findBestInterpretation(tokens as SequenceToken[]);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

    return processor;
}


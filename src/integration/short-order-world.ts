import * as path from 'path';

import {
    Processor,
    State,
    World
} from 'prix-fixe';

import { DefaultTermModel, Lexicon } from 'token-flow';

import { ILexicalAnalyzer, LexicalAnalyzer } from '../lexer';
import { Parser, processRoot } from '../parser';
import { StemmerFactory } from '../stemmers';

export interface ShortOrderWorld extends World {
    lexer: ILexicalAnalyzer;
    processor: Processor;
}

export function createShortOrderWorld(
    world: World,
    dataPath: string,
    stemmerName?: string,
    debugMode = false
): ShortOrderWorld {
    //
    // Set up short-order LexicalAnalyzer, Parser, and Processor.
    //
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const stemmerFactory = new StemmerFactory(dataPath);
    const stemmer = stemmerFactory.create(stemmerName);
    const termModel = new DefaultTermModel({stemmer});
    const lexicon = new Lexicon(termModel);

    const lexer = new LexicalAnalyzer(
        world,
        lexicon,
        debugMode,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    const parser = new Parser(
        world.cartOps,
        world.catalog,
        world.cookbook,
        world.attributeInfo,
        lexer,
        world.ruleChecker,
        debugMode);

    const processor = async (text: string, state: State): Promise<State> => {
        return processRoot(parser, state, text);
    };

    return {...world, lexer, processor};
}

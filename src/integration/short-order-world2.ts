import * as path from 'path';

import {
  Processor,
  State,
  World
} from 'prix-fixe';

import { DefaultTermModel, Lexicon, StemmerFunction } from 'token-flow';

import { ILexicalAnalyzer, LexicalAnalyzer2 } from '../lexer';
import { Parser, processRoot } from '../parser';
import { StemmerFactory2 } from '../lexer/stemmers2';
import { LexiconSpec } from '../lexer/types';

import { ShortOrderWorld } from './short-order-world';

export function createShortOrderWorld2(
  world: World,
  lexiconSpec: LexiconSpec,
  stemmerName?: string,
  debugMode = false
): ShortOrderWorld {
  //
  // Set up short-order LexicalAnalyzer, Parser, and Processor.
  //
  const stemmerFactory = new StemmerFactory2(lexiconSpec.replacers);
  const stemmer = stemmerFactory.create(stemmerName);
  const termModel = new DefaultTermModel({stemmer});
  const lexicon = new Lexicon(termModel);
  //const lexicon = new Lexicon();

  const lexer = new LexicalAnalyzer2(
    world,
    lexiconSpec,
    lexicon,
    debugMode,
  );

  const parser = new Parser(
    world.cartOps,
    world.catalog,
    world.cookbook,
    world.attributeInfo,
    lexer,
    world.ruleChecker,
    debugMode
  );

  const processor = async (text: string, state: State): Promise<State> => {
    return processRoot(parser, state, text);
  };

  return { ...world, lexer, processor };
}

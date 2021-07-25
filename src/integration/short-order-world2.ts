import { State, Processor, World } from 'prix-fixe';

import { DefaultTermModel, Lexicon } from 'token-flow';

import { ILexicalAnalyzer, LexicalAnalyzer2, LexiconSpec } from '../lexer';
import { StemmerFactory2 } from '../lexer/stemmers2';
import { Parser, processRoot } from '../parser';

export interface ShortOrderWorld extends World {
  lexer: ILexicalAnalyzer;
  processor: Processor;
}

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
  const termModel = new DefaultTermModel({ stemmer });
  const lexicon = new Lexicon(termModel);
  //const lexicon = new Lexicon();

  const lexer = new LexicalAnalyzer2(world, lexiconSpec, lexicon, debugMode);

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

import { State, Processor, World } from 'prix-fixe';

import { DefaultTermModel, Lexicon } from 'token-flow';

import {
  ILexicalAnalyzer,
  LexicalAnalyzer,
  LexiconSpec,
  StemmerFactory,
} from '../lexer';

import { InterpretationServices, Parser, processRoot } from '../parser';

export interface ShortOrderWorld extends World {
  lexer: ILexicalAnalyzer;
  processor: Processor;
}

export function createShortOrderWorld(
  world: World,
  lexiconSpec: LexiconSpec,
  stemmerName?: string,
  debugMode = false
): ShortOrderWorld {
  //
  // Set up short-order LexicalAnalyzer, Parser, and Processor.
  //
  const stemmerFactory = new StemmerFactory(lexiconSpec.replacers);
  const stemmer = stemmerFactory.create(stemmerName);
  const termModel = new DefaultTermModel({ stemmer });
  const lexicon = new Lexicon(termModel);
  //const lexicon = new Lexicon();

  const lexer = new LexicalAnalyzer(world, lexiconSpec, lexicon, debugMode);

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
    const services: InterpretationServices = {
      ...parser,
    };
    return processRoot(services, state, text);
  };

  return { ...world, lexer, processor };
}

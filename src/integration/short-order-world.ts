import { State, Processor, World } from 'prix-fixe';

import { DefaultTermModel, Lexicon } from 'token-flow';

import {
  ILexicalAnalyzer,
  LexicalAnalyzer,
  LexiconSpec,
  StemmerFactory,
} from '../lexer';

import { Services, processRoot } from '../parser';

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

  const services: Services = {
    attributes: world.attributeInfo,
    cartOps: world.cartOps,
    catalog: world.catalog,
    cookbook: world.cookbook,
    debugMode,
    lexer,
    rules: world.ruleChecker,
  };

  const processor = async (text: string, state: State): Promise<State> => {
    return processRoot(services, state, text);
  };

  return { ...world, lexer, processor };
}

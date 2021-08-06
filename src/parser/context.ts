import {
  AttributeInfo,
  ICartOps,
  ICatalog,
  ICookbook,
  IRuleChecker,
  State,
} from 'prix-fixe';

import { Graph } from 'token-flow';
import { ILexicalAnalyzer } from '../lexer';

// TODO: Services shouldn't be coupled to ILexicalAnalyzer. It should take an
// interface to a graph manipulation class or perhaps that code could be
// extracted from LexicalAnalyzer and exposed as simple functions.
// TODO: Fix LexicalAnalyzer hack (undefined!) in unit tests.
export interface Services {
  readonly attributes: AttributeInfo;
  readonly cartOps: ICartOps;
  readonly catalog: ICatalog;
  readonly cookbook: ICookbook;
  readonly debugMode: boolean;
  readonly lexer: ILexicalAnalyzer;
  readonly rules: IRuleChecker;
}

export interface Context {
  readonly graph: Graph;
  readonly services: Services;
  readonly state: State;
}

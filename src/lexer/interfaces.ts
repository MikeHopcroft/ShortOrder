import {
  Edge,
  Graph,
  Lexicon,
  Token,
  Tokenizer,
} from 'token-flow';

import {
  AID,
  PID,
} from 'prix-fixe';

import { AttributeToken } from './attributes';

export interface Span {
  start: number;
  length: number;
}

// tslint:disable-next-line:interface-name
export interface ILexicalAnalyzer {
  lexicon: Lexicon;
  tokenizer: Tokenizer;

  getEntityToken(pid: PID): Token;
  getAttributeToken(aid: AID): AttributeToken;
  createGraph(query: string): Graph;
}

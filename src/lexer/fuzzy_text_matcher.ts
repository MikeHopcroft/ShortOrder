import { Alias, generateAliases, Lexicon, Token, Tokenizer } from 'token-flow';

import {
  matcherFromExpression,
  patternFromExpression,
} from './lexical_utilities';

export interface FuzzyItem {
  id: number;
  pattern: string;
}

export interface FuzzyMatch {
  id: number;
  score: number;
}

export class FuzzyTextMatcher {
  private readonly lexicon: Lexicon;
  private readonly tokenizer: Tokenizer;

  constructor(items: IterableIterator<FuzzyItem>) {
    this.lexicon = new Lexicon();

    const debugMode = false;
    this.tokenizer = new Tokenizer(
      this.lexicon.termModel,
      this.lexicon.numberParser,
      debugMode
    );

    this.lexicon.addDomain(AliasesFromFuzzyItems(items));
    this.lexicon.ingest(this.tokenizer);
  }

  matches(query: string): FuzzyMatch[] {
    const terms = this.lexicon.termModel.breakWords(query);
    const stemmed = terms.map(this.lexicon.termModel.stem);
    const hashed = stemmed.map(this.lexicon.termModel.hashTerm);
    const graph = this.tokenizer.generateGraph(hashed, stemmed);

    const matches = new Map<number, FuzzyMatch>();
    for (const edges of graph.edgeLists) {
      for (const edge of edges) {
        const token = edge.token as FuzzyToken;
        if (token.type === FUZZY && edge.score > 0) {
          const match: FuzzyMatch = { id: token.id, score: edge.score };
          const existing = matches.get(match.id);
          if (!existing || match.score > existing.score) {
            matches.set(match.id, match);
          }
        }
      }
    }

    const tokens: FuzzyMatch[] = [];
    for (const match of matches.values()) {
      tokens.push(match);
    }

    return tokens.sort((a: FuzzyMatch, b: FuzzyMatch) => b.score - a.score);
  }
}

const FUZZY: unique symbol = Symbol('FUZZY');
type FUZZY = typeof FUZZY;

interface FuzzyToken extends Token {
  type: FUZZY;
  id: number;
}

function* AliasesFromFuzzyItems(
  items: IterableIterator<FuzzyItem>
): IterableIterator<Alias> {
  for (const item of items) {
    const token: FuzzyToken = { type: FUZZY, id: item.id };
    const matcher = matcherFromExpression(item.pattern);
    const pattern = patternFromExpression(item.pattern);
    for (const text of generateAliases(pattern)) {
      yield { token, text, matcher };
    }
  }
}

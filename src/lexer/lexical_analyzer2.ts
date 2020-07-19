import {
  Alias,
  Graph,
  Lexicon,
  Tokenizer,
  TokenizerAlias,
  Token,
} from 'token-flow';

import {
  AID,
  aliasesFromPattern,
  OPTION,
  PID,
  World,
} from 'prix-fixe';

import { AttributeToken, ATTRIBUTE } from './attributes';
import { generateRecipes } from './cookbook';
import { EntityToken, ENTITY } from './entities';
import { ILexicalAnalyzer } from './interfaces';

import {
  generateAttributes,
  generateOptions,
  generateProducts
} from './lexical_analyzer';

import {
  matcherFromExpression,
  patternFromExpression,
} from './lexical_utilities';

import { OptionToken } from './options';
import { createQuantity, QuantityToken } from './quantities';
import { LexiconSpec, TokenSpec } from './types';

export class LexicalAnalyzer2 implements ILexicalAnalyzer {
  lexicon: Lexicon;
  tokenizer: Tokenizer;
  tokens = new Map<Symbol, Token>();
  quantityTokens = new Map<number, QuantityToken>();

  private readonly aidToToken = new Map<AID, AttributeToken>();
  private readonly pidToToken = new Map<PID, Token>();

  constructor(
    world: World,
    spec: LexiconSpec,
    lexicon: Lexicon,
    debugMode = true,
  ) {
    this.lexicon = lexicon;

    this.tokenizer = new Tokenizer(
      this.lexicon.termModel,
      this.lexicon.numberParser,
      debugMode
    );

    // Attributes
    this.lexicon.addDomain(generateAttributes(world));

    // Products
    this.lexicon.addDomain(generateProducts(world));

    // Options
    this.lexicon.addDomain(generateOptions(world));

    // Cookbook
    this.lexicon.addDomain(generateRecipes(world));

    // LexiconSpec
    const { intents, quantifiers, stopwords, units } =
      sortTokenSpecs(spec.lexicon);

    this.lexicon.addDomain(this.generateQuantifierAliases(quantifiers));
    this.lexicon.addDomain(this.generateGeneralAliases(units));
    this.lexicon.addDomain(this.generateGeneralAliases(intents));
    this.lexicon.addDomain(this.generateGeneralAliases(stopwords));

    //
    // Ingest the lexicon into the tokenizer.
    //
    this.lexicon.ingest(this.tokenizer);

    //
    // Use ingest method to index attribute and entity tokens.
    //
    const addItem = (alias: TokenizerAlias): void => {
      const token = alias.token as AttributeToken | EntityToken | OptionToken;
      if (token.type === ENTITY) {
        const existing = this.pidToToken.get(token.pid);
        if (existing) {
          if (token !== existing) {
            const message =
              `indexEntityTokens: tokens must be unique  (pid=${token.pid}).`;
            throw TypeError(message);
          }
        } else {
          this.pidToToken.set(token.pid, token);
        }
      } else if (token.type === OPTION) {
        const existing = this.pidToToken.get(token.id);
        if (existing) {
          if (token !== existing) {
            const message =
              `indexEntityTokens: tokens must be unique  (pid=${token.id}).`;
            throw TypeError(message);
          }
        } else {
          this.pidToToken.set(token.id, token);
        }
      } else if (token.type === ATTRIBUTE) {
        const existing = this.aidToToken.get(token.id);
        if (existing) {
          if (token !== existing) {
            const message =
              `indexAttributeTokens: tokens must be unique  (aid=${token.id}).`;
            throw TypeError(message);
          }
        } else {
          this.aidToToken.set(token.id, token);
        }
      }
    };

    this.lexicon.ingest({ addItem });
  }

  getEntityToken(pid: PID): Token {
    const token = this.pidToToken.get(pid);
    if (!token) {
      const message = `getEntityToken(): unknown PID ${pid}.`;
      throw TypeError(message);
    }
    return token;
  }

  getAttributeToken(aid: AID): AttributeToken {
    const token = this.aidToToken.get(aid);
    if (!token) {
      const message = `getAttributeToken(): unknown AID ${aid}.`;
      throw TypeError(message);
    }
    return token;
  }

  createGraph(query: string): Graph {
    const terms = this.lexicon.termModel.breakWords(query);
    const stemmed = terms.map(this.lexicon.termModel.stem);
    const hashed = stemmed.map(this.lexicon.termModel.hashTerm);
    const rawGraph = this.tokenizer.generateGraph(hashed, stemmed);

    // DESIGN NOTE: coalesced graph is not needed because maximalPaths()
    // calls addTopScoringBackLink() which coalesces paths on the fly.

    return rawGraph;
  }

  *generateGeneralAliases(specs: TokenSpec[]): IterableIterator<Alias> {
    for (const spec of specs) {
      const symbol = Symbol.for(spec.name);

      let token = this.tokens.get(symbol);
      if (!token) {
        token = { type: symbol };
        this.tokens.set(symbol, token);
      }

      for (const alias of spec.aliases) {
        const matcher = matcherFromExpression(alias);
        const pattern = patternFromExpression(alias);
        for (const text of aliasesFromPattern(pattern)) {
          yield { token, text, matcher };
        }
      }
    }
  }

  *generateQuantifierAliases(specs: TokenSpec[]): IterableIterator<Alias> {
    for (const spec of specs) {
      if (spec.value === undefined) {
        const message = 'QUANTITY must specify a value.';
        throw new TypeError(message);
      }

      let token = this.quantityTokens.get(spec.value);
      if (!token) {
        token = createQuantity(spec.value);
        this.quantityTokens.set(spec.value, token);
      }

      for (const alias of spec.aliases) {
        const matcher = matcherFromExpression(alias);
        const pattern = patternFromExpression(alias);
        for (const text of aliasesFromPattern(pattern)) {
          yield { token, text, matcher };
        }
      }
    }
  }
}

interface SortedTokens {
  intents: TokenSpec[];
  quantifiers: TokenSpec[];
  stopwords: TokenSpec[];
  units: TokenSpec[];
}

function sortTokenSpecs(specs: TokenSpec[]): SortedTokens {
  const sorted: SortedTokens = {
    intents: [],
    quantifiers: [],
    stopwords: [],
    units: [],
  };

  for (const spec of specs) {
    switch (spec.name) {
      case 'QUANTITY':
        sorted.quantifiers.push(spec);
        break;
      case 'UNIT':
        sorted.units.push(spec);
        break;
      case 'UNKNOWNTOKEN':
        sorted.stopwords.push(spec);
        break;
      default:
        sorted.intents.push(spec);
    }
  }

  return sorted;
}


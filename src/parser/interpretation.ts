import { State } from 'prix-fixe';
import { Token } from 'token-flow';

import {
  addToOrder,
  createSpan,
  modifyItem,
  preposition,
  prologue,
  removeItem,
  Span,
} from '../lexer';

import { parseAdd } from './add';

import {
  Interpretation,
  product0,
  product1,
  productN,
  ProductToken,
} from './interfaces';

import {
  parseAddToImplicit,
  parseAddToTarget,
  parseReplace1,
  parseReplaceImplicit,
  parseReplaceTarget,
  processModify1,
} from './modify';

import {
  choose,
  createMatcher,
  Grammar,
  optional,
  processGrammar,
} from './pattern_matcher';

import { Context } from './parser';

import {
  parseRemove,
  parseRemoveImplicit,
  parseRemoveOptionFromImplicit,
  parseRemoveOptionFromTarget,
} from './remove';

import { Sequence } from './sequence';

// Equality predicate for tokens.
function equality(a: Token, b: Token): boolean {
  return a.type === b.type;
}

export function processAllActiveRegions2(
  context: Context,
  tokenization: Array<Token & Span>
): Interpretation {
  let state = context.state;

  const match = createMatcher<Token & Span, Interpretation>(equality);

  const grammar: Grammar<Interpretation> = [
    ///////////////////////////////////////////////////////////////////////////
    //
    // Add
    //
    ///////////////////////////////////////////////////////////////////////////

    match(
      optional(prologue),
      optional(addToOrder),
      product0,
      preposition,
      product1
    ).bind(([, , modification, , target]) => {
      return parseAddToTarget(
        context,
        modification.tokens,
        target.tokens,
        true
      );
    }),

    match(optional(prologue), optional(addToOrder), product0, preposition).bind(
      ([, , modification]) => {
        return parseAddToImplicit(context, modification.tokens, true);
      }
    ),

    match(
      optional(prologue),
      optional(addToOrder),
      choose(product1, productN)
    ).bind(([, , product]) => {
      return parseAdd(context.services, product.tokens);
    }),

    match(optional(prologue), optional(addToOrder), product0).bind(
      ([, , modification]) => {
        return parseAddToImplicit(context, modification.tokens, true);
      }
    ),

    ///////////////////////////////////////////////////////////////////////////
    //
    // Remove
    //
    ///////////////////////////////////////////////////////////////////////////

    match(optional(prologue), removeItem, choose(product1, productN)).bind(
      ([, , product]) => {
        const span = createSpan(product.tokens);
        return parseRemove(context, span);
      }
    ),

    match(optional(prologue), removeItem, product0, preposition, product1).bind(
      ([, , option, , target]) => {
        return parseRemoveOptionFromTarget(
          context,
          option as ProductToken & Span,
          target as ProductToken & Span
        );
      }
    ),

    match(optional(prologue), removeItem, product0).bind(([, , option]) => {
      return parseRemoveOptionFromImplicit(
        context,
        option as ProductToken & Span
      );
    }),

    // Test case 44.
    match(optional(prologue), removeItem, preposition).bind(() => {
      return parseRemoveImplicit(context);
    }),

    // // This case is unreachable because the previous case fires on "preposition".
    // // Remove that vanilla.
    // match(optional(prologue), removeItem, preposition).bind(([]) => {
    //   return parseRemoveOptionFromImplicit(parser, state, graph, parts);
    // }),

    ///////////////////////////////////////////////////////////////////////////
    //
    // Modify
    //
    ///////////////////////////////////////////////////////////////////////////

    match(
      optional(prologue),
      modifyItem,
      optional(preposition),
      product1,
      preposition,
      product0
    ).bind(([, , , target, , modification]) => {
      return parseAddToTarget(
        context,
        modification.tokens,
        target.tokens,
        false
      );
    }),

    match(optional(prologue), modifyItem, optional(preposition), product0).bind(
      ([, , , modification]) => {
        return parseAddToImplicit(context, modification.tokens, false);
      }
    ),

    // NOTE: this differs from old code by making the preposition optional.
    match(
      optional(prologue),
      modifyItem,
      optional(preposition),
      product1,
      optional(preposition),
      product1
    ).bind(([, , , target, , replacement]) => {
      return parseReplaceTarget(context, target.tokens, replacement.tokens);
    }),

    match(optional(prologue), modifyItem, optional(preposition), productN).bind(
      ([, , , parts]) => {
        return parseReplace1(context, parts.tokens);
      }
    ),

    match(optional(prologue), modifyItem, product1).bind(([, , parts]) => {
      return processModify1(context, parts.tokens);
    }),

    match(optional(prologue), modifyItem, preposition, product1).bind(
      ([, , , modification]) => {
        return parseReplaceImplicit(context, modification.tokens);
      }
    ),
  ];

  let score = 0;
  let tokenCount = 0;
  const input = new Sequence(tokenization);
  while (!input.atEOS()) {
    const interpretation = processGrammar(grammar, input);
    if (interpretation === undefined) {
      // We don't understand this token. Skip over it.
      input.discard();
    } else {
      score += interpretation.score;
      tokenCount += interpretation.tokenCount;
      state = interpretation.action(state);

      context = { ...context, state };
    }
  }

  return {
    score,
    tokenCount,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    action: (s: State): State => state,
  };
}

// function combineInterpretations(
//   a: Interpretation,
//   b: Interpretation
// ): Interpretation {
//   return {
//     score: a.score + b.score,
//     tokenCount: a.tokenCount + b.tokenCount,
//     action:
//   }
// }

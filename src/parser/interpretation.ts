import { State } from 'prix-fixe';

import {
  // filterGraph,
  Graph,
  Token,
  // UNKNOWNTOKEN,
  // maximalTokenizations,
} from 'token-flow';

import {
  addToOrder,
  // AnyToken,
  // attribute,
  // entity,
  modifyItem,
  // option,
  // optionRecipe,
  preposition,
  prologue,
  removeItem,
} from '../lexer';

import {
  // ADD_TO_ORDER,
  createSpan,
  // ENTITY,
  // MODIFY_ITEM,
  // PROLOGUE,
  // REMOVE_ITEM,
  Span,
  // tokenToString,
  // ATTRIBUTE,
  // OPTION_RECIPE,
} from '../lexer';

// import { processAdd } from './add';

import {
  Interpretation,
  // nop,
  product0,
  product1,
  productN,
  // PRODUCT_PARTS_0,
  // PRODUCT_PARTS_1,
  // PRODUCT_PARTS_N,
  ProductToken,
  // Segment,
  // SequenceToken,
} from './interfaces';

import { parseAdd } from './add';

import {
  parseAddToImplicit,
  parseAddToTarget,
  // processModify
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

import { Parser } from './parser';

import {
  parseRemove,
  parseRemoveImplicit,
  parseRemoveOptionFromImplicit,
  parseRemoveOptionFromTarget,
} from './remove';

import { Sequence } from './sequence';

// TODO:
//   Move prologue to its own nop rule
//   Nested grammars
//   Rearchitect interpretation actions
//   Rename and document parseReplace1

function equality(a: Token, b: Token): boolean {
  return a.type === b.type;
}

export function processAllActiveRegions2(
  parser: Parser,
  state: State,
  tokenization: Array<Token & Span>,
  graph: Graph
): Interpretation {
  const match = createMatcher<Token & Span, Interpretation>(equality);

  const grammar: Grammar<Interpretation> = [
    //
    // Add
    //

    match(
      optional(prologue),
      optional(addToOrder),
      product0,
      preposition,
      product1
    ).bind(([, , modification, , target]) => {
      return parseAddToTarget(
        parser,
        state,
        graph,
        modification.tokens,
        target.tokens,
        true
      );
    }),

    match(optional(prologue), optional(addToOrder), product0, preposition).bind(
      ([, , modification]) => {
        return parseAddToImplicit(
          parser,
          state,
          graph,
          modification.tokens,
          true
        );
      }
    ),

    match(
      optional(prologue),
      optional(addToOrder),
      choose(product1, productN)
    ).bind(([, , product]) => {
      return parseAdd(parser, product.tokens);
    }),

    match(optional(prologue), optional(addToOrder), product0).bind(
      ([, , modification]) => {
        return parseAddToImplicit(
          parser,
          state,
          graph,
          modification.tokens,
          true
        );
      }
    ),

    //
    // Remove
    //

    match(optional(prologue), removeItem, choose(product1, productN)).bind(
      ([, , product]) => {
        const span = createSpan(product.tokens);
        return parseRemove(parser, state, graph, span);
      }
    ),

    match(optional(prologue), removeItem, product0, preposition, product1).bind(
      ([, , option, , target]) => {
        return parseRemoveOptionFromTarget(
          parser,
          state,
          graph,
          option as ProductToken & Span,
          target as ProductToken & Span
        );
      }
    ),

    match(optional(prologue), removeItem, product0).bind(([, , option]) => {
      return parseRemoveOptionFromImplicit(
        parser,
        state,
        graph,
        option as ProductToken & Span
      );
    }),

    // Does this ever happen? "remove that?" Test case 44.
    match(optional(prologue), removeItem, preposition).bind(() => {
      return parseRemoveImplicit(parser, state);
    }),

    // // This case is unreachable because the previous case fires on "preposition".
    // // Remove that vanilla.
    // match(optional(prologue), removeItem, preposition).bind(([]) => {
    //   return parseRemoveOptionFromImplicit(parser, state, graph, parts);
    // }),

    //
    // Modify
    //

    match(
      optional(prologue),
      modifyItem,
      optional(preposition),
      product1,
      preposition,
      product0
    ).bind(([, , , target, , modification]) => {
      return parseAddToTarget(
        parser,
        state,
        graph,
        modification.tokens,
        target.tokens,
        false
      );
    }),

    match(optional(prologue), modifyItem, optional(preposition), product0).bind(
      ([, , , modification]) => {
        return parseAddToImplicit(
          parser,
          state,
          graph,
          modification.tokens,
          false
        );
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
      return parseReplaceTarget(
        parser,
        state,
        graph,
        target.tokens,
        replacement.tokens
      );
    }),

    match(optional(prologue), modifyItem, optional(preposition), productN).bind(
      ([, , , parts]) => {
        return parseReplace1(parser, state, graph, parts.tokens);
      }
    ),

    match(optional(prologue), modifyItem, product1).bind(([, , parts]) => {
      return processModify1(parser, state, graph, parts.tokens);
    }),

    match(optional(prologue), modifyItem, preposition, product1).bind(
      ([, , , modification]) => {
        return parseReplaceImplicit(parser, state, graph, modification.tokens);
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
    }
  }

  // return nop;
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

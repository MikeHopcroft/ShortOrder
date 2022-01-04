import { OPTION, State } from 'prix-fixe';
import { Token, UNKNOWNTOKEN, UnknownToken } from 'token-flow';

import {
  addToOrder,
  ATTRIBUTE,
  attribute,
  conjunction,
  createSpan,
  ENTITY,
  entity,
  modifyItem,
  numberToken,
  OPTION_RECIPE,
  optionRecipe,
  option,
  preposition,
  prologue,
  quantity,
  removeItem,
  Span,
  tokenToString,
  unit,
} from '../lexer';

import { parseAdd } from './add';

import {
  Interpretation,
  PRODUCT_PARTS_0,
  PRODUCT_PARTS_1,
  PRODUCT_PARTS_N,
  product0,
  product1,
  productN,
  ProductToken,
  SequenceToken,
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
  dot,
  Grammar,
  optional,
  plus,
  processGrammar,
} from './pattern_matcher';

import { Context } from './context';

import {
  parseRemove,
  parseRemoveImplicit,
  parseRemoveOptionFromImplicit,
  parseRemoveOptionFromTarget,
} from './remove';

import { Sequence } from './sequence';

// TODO: where does this go?
export const unknownToken = { type: UNKNOWNTOKEN } as UnknownToken;

// Equality predicate for tokens.
function tokensHaveSameType(a: Token, b: Token): boolean {
  return a.type === b.type;
}

export function createInterpretation(
  context: Context,
  tokens: Array<Token & Span>
): Interpretation {
  const services = context.services;

  if (services.debugMode) {
    console.log(' ');
    console.log(tokens.map(tokenToString).join(''));
  }

  const grouped = groupProductTokens(tokens);
  if (services.debugMode) {
    console.log(grouped.map(tokenToString).join(''));
  }

  return processAllActiveRegions(context, grouped);
}

function groupProductTokens(tokens: Array<Token & Span>): Array<Token & Span> {
  const input = new Sequence(tokens);
  const grouped: Array<Token & Span> = [];

  const match = createMatcher<Token & Span, boolean | undefined>(
    tokensHaveSameType
  );

  const grammar = [
    // Group runs of product-related tokens into Product0, Product1 and
    // ProductN tokens:
    //   * Product0 tokens are associated with runs that contain
    //     zero entities.
    //   * Product1 tokens are associated with runs that contain
    //     exactly one entity.
    //   * ProductN tokens are associated with runs that contain
    //     two or more entities.
    match(
      plus(
        choose(
          attribute,
          conjunction,
          entity,
          option,
          optionRecipe,
          numberToken,
          quantity,
          unknownToken,
          unit
        )
      )
    ).bind(([group]) => {
      const g = group.map((x) => x[0] as typeof x[0] & Span);
      grouped.push(...createProductToken(g));
      return true;
    }),

    // Copy over any token that doesn't match the product grouping pattern.
    match(dot).bind(([token]) => {
      grouped.push(token);
      return true;
    }),
  ];

  while (!input.atEOS()) {
    processGrammar(grammar, input);
  }

  return grouped;
}

function createProductToken(
  tokens: Array<SequenceToken & Span>
): Array<Token & Span> {
  // Count entities and options
  let entityCount = 0;
  let optionAttributeCount = 0;
  for (const token of tokens) {
    if (
      token.type === ENTITY // ||
      //  token.type === PRODUCT_RECIPE
    ) {
      ++entityCount;
    } else if (
      token.type === OPTION ||
      token.type === OPTION_RECIPE ||
      token.type === ATTRIBUTE
    ) {
      ++optionAttributeCount;
    }
  }

  // Use entity and option counts to determine type of token to create.
  const span = createSpan(tokens);
  if (entityCount === 0 && optionAttributeCount > 0) {
    const product: ProductToken & Span = {
      type: PRODUCT_PARTS_0,
      tokens,
      ...span,
    };
    return [product];
  } else if (entityCount === 1) {
    const product: ProductToken & Span = {
      type: PRODUCT_PARTS_1,
      tokens,
      ...span,
    };
    return [product];
  } else if (entityCount > 1) {
    const product: ProductToken & Span = {
      type: PRODUCT_PARTS_N,
      tokens,
      ...span,
    };
    return [product];
  } else {
    // This is not a sequence of product tokens.
    // Could be a sequence of UNKNOWNTOKENs
    return tokens;
  }
}

export function processAllActiveRegions(
  context: Context,
  tokenization: Array<Token & Span>
): Interpretation {
  let state = context.state;

  const match = createMatcher<Token & Span, Interpretation>(tokensHaveSameType);

  const grammar: Grammar<Interpretation> = [
    match(prologue).bind(() => ({
      action: (state: State) => state,
      score: 0,
      tokenCount: 1,
    })),

    ///////////////////////////////////////////////////////////////////////////
    //
    // Add
    //
    ///////////////////////////////////////////////////////////////////////////

    // "Add vanilla syrup to the tall latte"
    match(optional(addToOrder), product0, preposition, product1).bind(
      ([, modification, , target]) => {
        return parseAddToTarget(
          context,
          modification.tokens,
          target.tokens,
          true
        );
      }
    ),

    // TODO: make test case
    // "Can I get foam with that?"
    // match(optional(addToOrder), product0, preposition).bind(
    //   ([, modification]) => {
    //     return parseAddToImplicit(context, modification.tokens, true);
    //   }
    // ),

    // "I'd like an apple bran muffin and a decaf latte"
    match(optional(addToOrder), choose(product1, productN)).bind(
      ([, product]) => {
        return parseAdd(context.services, product.tokens);
      }
    ),

    // "Can you add a dash of cinnamon?"
    match(optional(addToOrder), product0).bind(([, modification]) => {
      return parseAddToImplicit(context, modification.tokens, true);
    }),

    ///////////////////////////////////////////////////////////////////////////
    //
    // Remove
    //
    ///////////////////////////////////////////////////////////////////////////

    // "Remove that tall latte"
    match(removeItem, choose(product1, productN)).bind(([, product]) => {
      const span = createSpan(product.tokens);
      return parseRemove(context, span);
    }),

    // "Take the vanilla from the latte"
    match(removeItem, product0, preposition, product1).bind(
      ([, option, , target]) => {
        return parseRemoveOptionFromTarget(
          context,
          option as ProductToken & Span,
          target as ProductToken & Span
        );
      }
    ),

    // "Lose the vanilla"
    match(removeItem, product0).bind(([, option]) => {
      return parseRemoveOptionFromImplicit(
        context,
        option as ProductToken & Span
      );
    }),

    // Test case 44.
    // "Remove that"
    match(removeItem, preposition).bind(() => {
      return parseRemoveImplicit(context);
    }),

    ///////////////////////////////////////////////////////////////////////////
    //
    // Modify
    //
    ///////////////////////////////////////////////////////////////////////////

    // "Make that tall latte with vanilla syrup"
    match(
      modifyItem,
      optional(preposition),
      product1,
      preposition,
      product0
    ).bind(([, , target, , modification]) => {
      return parseAddToTarget(
        context,
        modification.tokens,
        target.tokens,
        false
      );
    }),

    match(modifyItem, optional(preposition), product0).bind(
      ([, , modification]) => {
        return parseAddToImplicit(context, modification.tokens, false);
      }
    ),

    // NOTE: this differs from old code by making the preposition optional.
    // However, there would never be two separate product1 tokens unless
    // they were separated by something (like a preposition). Without the
    // separation, they would be combined into a productN.
    match(
      modifyItem,
      optional(preposition),
      product1,
      optional(preposition),
      product1
    ).bind(([, , target, , replacement]) => {
      return parseReplaceTarget(context, target.tokens, replacement.tokens);
    }),

    match(modifyItem, optional(preposition), productN).bind(([, , parts]) => {
      return parseReplace1(context, parts.tokens);
    }),

    match(modifyItem, product1).bind(([, parts]) => {
      return processModify1(context, parts.tokens);
    }),

    match(modifyItem, preposition, product1).bind(([, , modification]) => {
      return parseReplaceImplicit(context, modification.tokens);
    }),
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

      // TODO: consider catching exceptions here and setting
      // score to zero.
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

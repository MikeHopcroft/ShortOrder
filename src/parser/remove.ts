import { State } from 'prix-fixe';
import { Token } from 'token-flow';

import { createSpan, PROLOGUE, REMOVE_ITEM, Span, PREPOSITION } from '../lexer';

import {
  Interpretation,
  nop,
  PRODUCT_PARTS_1,
  PRODUCT_PARTS_N,
  ProductToken,
  PRODUCT_PARTS_0,
} from './interfaces';

import { Context } from './context';
import { optionTargets, productTargets } from './target';
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product remove operation.
//
// Assumes that `tokens` starts with:
//     [PROLOGUE] REMOVE_ITEM (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
export function processRemove(
  context: Context,
  tokens: TokenSequence<Token & Span>
): Interpretation {
  if (tokens.peek(0).type === PROLOGUE) {
    tokens.take(1);
  }
  if (tokens.peek(0).type === REMOVE_ITEM) {
    tokens.take(1);
  }

  if (!tokens.atEOS()) {
    const token = tokens.peek(0);
    if (token.type === PRODUCT_PARTS_1 || token.type === PRODUCT_PARTS_N) {
      const parts = token as ProductToken & Span;
      tokens.take(1);
      const span = createSpan(parts.tokens);
      return parseRemove(context, span);
    } else if (
      tokens.startsWith([
        // PREPOSITION,
        PRODUCT_PARTS_0,
        PREPOSITION,
        PRODUCT_PARTS_1,
      ])
    ) {
      // console.log('remove OPTION from TARGET');
      const option = tokens.peek(0) as ProductToken & Span;
      const target = tokens.peek(2) as ProductToken & Span;
      tokens.take(3);
      return parseRemoveOptionFromTarget(context, option, target);
    } else if (token.type === PRODUCT_PARTS_0) {
      // console.log('remove OPTION from IMPLICIT (1)');
      const parts = token as ProductToken & Span;
      tokens.take(1);
      return parseRemoveOptionFromImplicit(context, parts);
    } else if (token.type === PREPOSITION) {
      // TODO: add a test to exercise this case.
      // This is test 44: "remove that"
      // "that" is a pronoun, not a preposition
      // Does it ever happen? It may be that the REMOVE_ITEM
      // aliases always include a PREPOSITION.
      tokens.take(1);
      return parseRemoveImplicit(context);
    }
    // } else if (tokens.startsWith([PREPOSITION, PRODUCT_PARTS_0])) {
    //   // TODO: BUGBUG: can this case ever fire since the last case is for PREPOSITION?
    //   // console.log('remove OPTION from IMPLICIT (2)');
    //   const parts = tokens.peek(1) as ProductToken & Span;
    //   tokens.take(2);
    //   return parseRemoveOptionFromImplicit(parser, state, graph, parts);
    // }
  }

  return nop;
}

export function parseRemove(context: Context, span: Span): Interpretation {
  let interpretation: Interpretation = nop;

  for (const target of productTargets(context, span)) {
    if (target.score > interpretation.score) {
      const item = target.item!;
      interpretation = {
        score: target.score,
        tokenCount: span.length,
        action: (state: State): State => {
          const cart = context.services.cartOps.removeFromCart(
            context.state.cart,
            item.uid
          );
          return { ...state, cart };
        },
      };
    }
  }

  return interpretation;
}

export function parseRemoveImplicit(context: Context): Interpretation {
  return {
    score: 1,
    tokenCount: 0,
    action: (state: State): State => {
      let cart = state.cart;
      const count = cart.items.length;
      if (count > 0) {
        const last = cart.items[count - 1];
        cart = context.services.cartOps.removeFromCart(cart, last.uid);
        return { ...state, cart };
      } else {
        return state;
      }
    },
  };
}

export function parseRemoveOptionFromImplicit(
  context: Context,
  parts: ProductToken & Span
): Interpretation {
  const optionSpan = createSpan(parts.tokens);

  // Walk through items in reverse order to favor more recent items.
  let interpretation: Interpretation = nop;
  const items = context.state.cart.items;
  for (let i = items.length - 1; i >= 0; --i) {
    const item = items[i];
    for (const optionInterpretation of optionTargets(
      context,
      item,
      optionSpan
    )) {
      const score = optionInterpretation.score;
      const tokenCount = optionInterpretation.tokenCount;
      if (score > interpretation.score && optionInterpretation.item) {
        interpretation = {
          score,
          tokenCount,
          action: (state: State): State => {
            const cart = context.services.cartOps.removeFromCart(
              state.cart,
              optionInterpretation.item!.uid
            );
            return { ...state, cart };
          },
        };
      }
    }
  }

  return interpretation;
}

export function parseRemoveOptionFromTarget(
  context: Context,
  optionTokens: ProductToken & Span,
  targetTokens: ProductToken & Span
): Interpretation {
  // console.log('parseRemoveOptionFromTarget() not implemented.');
  // Instead of getting filtering graph with cart, want to filter with target item instance.
  // In this implicit case, target item instance is last item in the cart.

  const optionSpan = createSpan(optionTokens.tokens);
  const targetSpan = createSpan(targetTokens.tokens);
  let interpretation: Interpretation = nop;

  for (const targetInterpretation of productTargets(context, targetSpan)) {
    if (targetInterpretation.item) {
      // For this target, interpret the option tokens relative to
      // a cart with only the target.

      // ISSUE: do we also score option interpretations?
      // TODO: need some way to get targets of options only.
      // TODO: need some way to build and return option targets.
      for (const optionInterpretation of optionTargets(
        context,
        targetInterpretation.item,
        optionSpan
      )) {
        const score = targetInterpretation.score + optionInterpretation.score;
        const tokenCount =
          targetInterpretation.tokenCount + optionInterpretation.tokenCount;
        // console.log(`score = ${score}`);
        if (score > interpretation.score && optionInterpretation.item) {
          interpretation = {
            score,
            tokenCount,
            action: (state: State): State => {
              const cart = context.services.cartOps.removeFromCart(
                state.cart,
                optionInterpretation.item!.uid
              );
              return { ...state, cart };
            },
          };
        }
      }
    }
  }

  return interpretation;
}

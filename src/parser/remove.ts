import { State } from 'prix-fixe';

import { createSpan, Span } from '../lexer';

import { Context } from './context';
import { Interpretation, nop, ProductToken } from './interfaces';
import { optionTargets, productTargets } from './target';

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

// TODO: REVIEW:
// This function seems to remove last product from cart.
// What if intention was to remove last option added?
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

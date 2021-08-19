import { State } from 'prix-fixe';
import { Token } from 'token-flow';

import { createSpan, EntityToken, Span } from '../lexer';

import { segmentLength } from './add';
import { Context, Services } from './context';

import {
  EntityBuilder,
  ModificationBuilder,
  ReplacementBuilder,
} from './entity_builder_base_2';

import {
  GapToken,
  HypotheticalItem,
  Interpretation,
  nop,
  Segment,
  SequenceToken,
} from './interfaces';

import { enumerateSplits, splitOnEntities } from './parser_utilities';
import { productTargets } from './target';

export function processModify1(
  context: Context,
  productAndModification: Array<SequenceToken & Span>
): Interpretation {
  let best = nop;

  const { entities, gaps } = splitOnEntities(productAndModification);
  if (gaps.length === 2 && gaps[1].length >= 1) {
    // We have exactly one entity (two gaps) and the gap to the right of
    // the entity has at least one token.

    const product = [...gaps[0], entities[0]];
    const modifiers = [...gaps[1]];
    while (modifiers.length > 0) {
      const interpretation = parseAddToTarget(
        context,
        modifiers,
        product,
        false
      );

      if (interpretation.score > best.score) {
        best = interpretation;
      }

      product.push(modifiers.shift()!);
    }
  }

  return best;
}

export function parseAddToImplicit(
  context: Context,
  modification: Array<Token & Span>,
  combineQuantities: boolean
): Interpretation {
  const cart = context.state.cart;
  // console.log(`Modifying`);
  // console.log(`  ${target.map(tokenToString).join('')}`);
  // console.log(`with`);
  // console.log(`  ${modification.map(tokenToString).join('')}`);

  let best = nop;

  // Search in reverse order to favor more recently added items.
  for (let i = cart.items.length - 1; i >= 0; --i) {
    const item = cart.items[i];
    const interpretation = parseAddToItem(
      context,
      modification,
      {
        item,
        score: 1,
        tokenCount: modification.length,
      },
      combineQuantities
    );
    if (interpretation.score > best.score) {
      best = interpretation;
    }
  }
  return best;
}

export function parseAddToTarget(
  context: Context,
  modification: Array<Token & Span>,
  target: Array<Token & Span>,
  combineQuantities: boolean
): Interpretation {
  // console.log(`Modifying`);
  // console.log(`  ${target.map(tokenToString).join('')}`);
  // console.log(`with`);
  // console.log(`  ${modification.map(tokenToString).join('')}`);

  const span = createSpan(target);
  let best = nop;
  for (const targetItem of productTargets(context, span)) {
    const interpretation = parseAddToItem(
      context,
      modification,
      targetItem,
      combineQuantities
    );
    if (interpretation.score > best.score) {
      best = interpretation;
    }
  }
  return best;
}

export function parseAddToItem(
  context: Context,
  modification: Array<Token & Span>,
  targetItem: HypotheticalItem,
  combineQuantities: boolean
): Interpretation {
  if (targetItem.item) {
    // console.log(`  target: ${targetItem.item.key} (uid=${targetItem.item!.uid})`);
    const builder = new ModificationBuilder(
      context.services,
      targetItem.item,
      modification as GapToken[],
      combineQuantities
    );

    const modified = builder.getItem();

    // Score for the entire intrepretation is the sum of the scores of the
    // target item and the modifications from the builder. Subtract one
    // because there is no token for the entity in the modifications.
    const score = targetItem.score + builder.getScore() - 1;

    const interpretation: Interpretation = {
      score,
      tokenCount: modification.length,
      action: (state: State): State => {
        const cart = context.services.cartOps.replaceInCart(
          context.state.cart,
          modified
        );
        return { ...state, cart };
      },
    };
    return interpretation;
  }
  return nop;
}

export function parseReplace1(
  context: Context,
  partTokens: Array<Token & Span>
): Interpretation {
  // Break into sequence of gaps and the entities that separate them.
  const { entities, gaps } = splitOnEntities(
    partTokens as Array<SequenceToken & Span>
  );

  if (entities.length !== 2) {
    // TODO: are there scenarios like "I made x y a z" or "I made x a y and z"?
    // We need a target and a replaement.
    // Return an empty interpretation.
    return nop;
  }

  // Enumerate all combinations of split points in gaps.
  const lengths: number[] = gaps.map((x) => x.length);

  let best = nop;
  for (const splits of enumerateSplits(lengths)) {
    // Construct the sequence of Segments associated with a particular
    // choice of split points.
    const segments: Segment[] = entities.map(
      (entity: EntityToken, index: number) => ({
        left: gaps[index].slice(splits[index]),
        entity: entity.pid,
        right: gaps[index + 1].slice(0, splits[index + 1]),
      })
    );

    if (segments.length === 2) {
      const targetTokens = [
        ...segments[0].left,
        entities[0],
        ...segments[0].right,
      ];
      const replacementTokens = [
        ...segments[1].left,
        entities[1],
        ...segments[1].right,
      ];

      const interpretation = parseReplaceTarget(
        context,
        // TODO: remove type assertion
        targetTokens as Array<Token & Span>,
        replacementTokens as Array<Token & Span>
      );
      if (interpretation.score > best.score) {
        best = interpretation;
      }
    }
  }

  return best;
}

export function parseReplaceTarget(
  context: Context,
  targetTokens: Array<Token & Span>,
  replacementTokens: Array<Token & Span>
): Interpretation {
  let best = nop;
  const span = createSpan(targetTokens);
  for (const targetItem of productTargets(context, span)) {
    const interpretation = parseReplaceItemWithTokens(
      context,
      targetItem,
      replacementTokens
    );
    if (interpretation.score > best.score) {
      best = interpretation;
    }
  }
  return best;
}

function parseReplaceItemWithTokens(
  context: Context,
  target: HypotheticalItem,
  replacementTokens: Array<Token & Span>
): Interpretation {
  if (target.item) {
    const { entities, gaps } = splitOnEntities(
      replacementTokens as Array<SequenceToken & Span>
    );
    if (gaps.length === 2 && entities.length === 1) {
      const segment: Segment = {
        left: gaps[0],
        entity: entities[0].pid,
        right: gaps[1],
      };

      const builder = new ReplacementBuilder(
        context.services,
        target.item,
        segment
      );
      return parseReplaceItem(context, target, {
        item: builder.getItem(),
        score: builder.getScore(),
        tokenCount: target.tokenCount + replacementTokens.length,
      });
    }
  }

  return nop;
}

function parseReplaceItem(
  context: Context,
  target: HypotheticalItem,
  replacement: HypotheticalItem
): Interpretation {
  if (target.item && replacement.item) {
    // If the replacement specifies children use them.
    // Otherwise keep the children from the target.
    const children =
      replacement.item.children.length > 0
        ? replacement.item.children
        : target.item.children;
    const item = {
      ...replacement.item,
      children,
      uid: target.item.uid,
    };
    const cart = context.services.cartOps.replaceInCart(
      context.state.cart,
      item
    );
    return {
      score: target.score + replacement.score,
      tokenCount: target.tokenCount + replacement.tokenCount,
      action: (state: State): State => {
        return { ...state, cart };
      },
    };
  }

  return nop;
}

export function parseReplaceImplicit(
  context: Context,
  replacementTokens: Array<SequenceToken & Span>
): Interpretation {
  const items = context.state.cart.items;
  if (items.length > 0) {
    const replacement = parserBuildItemFromTokens(
      context.services,
      replacementTokens
    );
    const target: HypotheticalItem = {
      item: items[items.length - 1],
      score: 1,
      tokenCount: 0,
    };
    return parseReplaceItem(context, target, replacement);
  }

  return nop;
}

function parserBuildItemFromTokens(
  services: Services,
  tokens: Array<Token & Span>
): HypotheticalItem {
  const { entities, gaps } = splitOnEntities(
    tokens as Array<SequenceToken & Span>
  );
  if (gaps.length === 2 && entities.length === 1) {
    const segment: Segment = {
      left: gaps[0],
      entity: entities[0].pid,
      right: gaps[1],
    };
    return parserBuildItemFromSegment(services, segment);
  }

  return { item: undefined, tokenCount: 0, score: 0 };
}

function parserBuildItemFromSegment(
  services: Services,
  segment: Segment
): HypotheticalItem {
  const builder = new EntityBuilder(services, segment);
  return {
    item: builder.getItem(),
    score: builder.getScore(),
    tokenCount: segmentLength(segment),
  };
}

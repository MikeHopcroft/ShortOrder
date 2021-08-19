import { ItemInstance, State } from 'prix-fixe';

import { EntityToken, Span } from '../lexer';

import { Services } from './context';
import { EntityBuilder } from './entity_builder_base_2';

import {
  HypotheticalItem,
  Interpretation,
  nop,
  Segment,
  SequenceToken,
} from './interfaces';

import { enumerateSplits, splitOnEntities } from './parser_utilities';

// Find the best Interpretation for an array of SequenceTokens representing
// the addition of one or more products.
// TODO: stop exporting this function - it is exported for unit testing.
export function parseAdd(
  services: Services,
  tokens: Array<SequenceToken & Span>
): Interpretation {
  const interpretations: Interpretation[] = [];

  // Break into sequence of gaps and the entities that separate them.
  const { entities, gaps } = splitOnEntities(tokens);

  if (entities.length < 1) {
    // There's no entity here.
    // Return an empty interpretation.
    return nop;
  }

  // Enumerate all combinations of split points in gaps.
  const lengths: number[] = gaps.map((x) => x.length);

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

    // Parse these segments to produce an interpretation for this
    // choice of split points.
    // TODO: BUGBUG: following line modifies segments[X].left, right
    // TODO: BUGBUG: TokenSequence shouldn't modifiy tokens[].
    const interpretation = interpretSegmentArray(services, segments);

    interpretations.push(interpretation);
  }

  // console.log(`  interpretations: ${interpretations.length}`);

  if (interpretations.length > 0) {
    // We found at least one interpretation.
    // Sort interpretations by decreasing score.
    // TODO: Generalize compare function here?
    interpretations.sort((a, b) => b.score - a.score);

    // Return the highest scoring interpretation.
    // TODO: when there is more than one top-scoring interpretations,
    // probably want to pick the one that associates right. Look at this
    return interpretations[0];
  } else {
    // We didn't find any interpretations.
    // Return an empty interpretation.
    return nop;
  }
}

function interpretSegmentArray(
  services: Services,
  segments: Segment[]
): Interpretation {
  let score = 0;
  let tokenCount = 0;
  const items: ItemInstance[] = [];
  for (const segment of segments) {
    const x = interpretOneSegment(services, segment);
    if (x.item !== undefined) {
      score += x.score;
      tokenCount += segmentLength(segment); // TODO: Why not x.tokenCount?
      items.push(x.item);
    }
  }

  const action = (state: State): State => {
    let updated = state.cart;
    for (const item of items) {
      updated = services.cartOps.addToCart(updated, item);
    }

    return { ...state, cart: updated };
  };

  return { score, tokenCount, action };
}

function interpretOneSegment(
  services: Services,
  segment: Segment
): HypotheticalItem {
  const builder = new EntityBuilder(services, segment);

  const item = builder.getItem();
  if (services.catalog.hasKey(item.key)) {
    return {
      score: builder.getScore(),
      tokenCount: segmentLength(segment),
      item,
    };
  } else {
    return {
      score: 0,
      tokenCount: 0,
      item: undefined,
    };
  }
}

// TODO: where does this function belong?
export function segmentLength(segment: Segment): number {
  return segment.left.length + segment.right.length + 1;
}

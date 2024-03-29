import { ENTITY, EntityToken, Span } from '../lexer';

import { GapToken, SequenceToken } from './interfaces';

export interface Splits {
  entities: Array<EntityToken & Span>;
  // entities: Array<AnyProductToken & Span>;
  gaps: Array<Array<GapToken & Span>>;
}

export function splitOnEntities(tokens: Array<SequenceToken & Span>): Splits {
  const entities: Array<EntityToken & Span> = [];
  const gaps: Array<Array<GapToken & Span>> = [];

  let currentGap: Array<GapToken & Span> = [];
  for (const token of tokens) {
    if (token.type === ENTITY) {
      gaps.push(currentGap);
      currentGap = [];
      entities.push(token);
    } else {
      currentGap.push(token);
    }
  }

  // Every entity must be followed by a gap, even if the gap is empty.
  if (entities.length > 0 || currentGap.length > 0) {
    gaps.push(currentGap);
  }

  return { entities, gaps };
}

export function* enumerateSplits(
  lengths: number[]
): IterableIterator<number[]> {
  if (lengths.length < 2) {
    const message = 'enumerateSplits: must have at least two lengths.';
    throw TypeError(message);
  } else {
    // for (const middle of enumerateSplitsRecursion(0, lengths.slice(1, -1))) {
    for (const middle of enumerateSplitsRecursion(0, lengths)) {
      yield middle;
    }
  }
}

function* enumerateSplitsRecursion(
  position: number,
  lengths: number[]
): IterableIterator<number[]> {
  if (position === 0) {
    // First region only associates to the right.
    for (const rest of enumerateSplitsRecursion(position + 1, lengths)) {
      yield [0, ...rest];
    }
  } else if (position === lengths.length - 1) {
    // Last region only associates to the left.
    yield [lengths[position]];
  } else {
    // Interior regions can spit either way.
    // Need to enumerate all split positions.
    for (let i = 0; i <= lengths[position]; ++i) {
      for (const rest of enumerateSplitsRecursion(position + 1, lengths)) {
        yield [i, ...rest];
      }
    }
  }
}

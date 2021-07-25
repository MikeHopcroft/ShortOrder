import { Alias } from 'token-flow';

import { aliasesFromPattern, MENUITEM, OPTION, World } from 'prix-fixe';

import { createAttribute } from './attributes';
import { createEntity } from './entities';
import { Span } from './interfaces';

import {
  matcherFromExpression,
  patternFromExpression,
} from './lexical_utilities';

import { createOption } from './options';

export function* generateAttributes(world: World): IterableIterator<Alias> {
  for (const dimension of world.attributes.dimensions) {
    // console.log(`  Dimension(${dimension.did}): ${dimension.name}`);
    for (const attribute of dimension.attributes) {
      // console.log(`    Attribute(${attribute.aid})`);
      const token = createAttribute(attribute.aid, attribute.name);
      for (const alias of attribute.aliases) {
        const matcher = matcherFromExpression(alias);
        const pattern = patternFromExpression(alias);
        for (const text of aliasesFromPattern(pattern)) {
          // console.log(`      ${text}`);
          yield { token, text, matcher };
        }
      }
    }
  }
}

export function* generateProducts(world: World): IterableIterator<Alias> {
  // console.log();
  // console.log('=== Products ===');
  for (const item of world.catalog.genericEntities()) {
    if (item.kind === MENUITEM) {
      const token = createEntity(item.pid, item.name);
      for (const alias of item.aliases) {
        const matcher = matcherFromExpression(alias);
        const pattern = patternFromExpression(alias);
        for (const text of aliasesFromPattern(pattern)) {
          // console.log(`  ${text}`);
          yield { token, text, matcher };
        }
      }
    }
  }
}

export function* generateOptions(world: World): IterableIterator<Alias> {
  // console.log();
  // console.log('=== Options ===');
  for (const item of world.catalog.genericEntities()) {
    if (item.kind === OPTION) {
      const token = createOption(item.pid, item.name);
      for (const alias of item.aliases) {
        const matcher = matcherFromExpression(alias);
        const pattern = patternFromExpression(alias);
        for (const text of aliasesFromPattern(pattern)) {
          // console.log(`  ${text}`);
          yield { token, text, matcher };
        }
      }
    }
  }
}

export function createSpan(spans: Span[]): Span {
  if (spans.length === 0) {
    return { start: 0, length: 0 };
  } else {
    const first = spans[0];
    const last = spans[spans.length - 1];
    return {
      start: first.start,
      length: last.start + last.length - first.start,
    };
  }
}

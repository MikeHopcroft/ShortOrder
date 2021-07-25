import { assert } from 'chai';
import 'mocha';

import { FuzzyItem, FuzzyTextMatcher } from '../../src';

describe('Fuzzy Text Matcher', () => {
  it('Levenstein', () => {
    const items: FuzzyItem[] = [
      { id: 1, pattern: 'ice cream [cone]' },
      { id: 2, pattern: 'ice cream cake' },
      { id: 3, pattern: 'cookies and cream' },
      { id: 4, pattern: 'chocolate chip cookies' },
    ];

    const matcher = new FuzzyTextMatcher(items.values());

    const results1 = matcher.matches('ice cream cookies');
    const expected1 = [
      { id: 1, score: 2.0 },
      { id: 2, score: 1 + 1 / 3 },
      { id: 3, score: 1 / 3 },
      { id: 4, score: 1 / 3 },
    ];
    assert.deepEqual(results1, expected1);

    const results2 = matcher.matches('ice cream cone');
    const expected2 = [
      { id: 1, score: 3.0 },
      { id: 2, score: 1 + 1 / 3 },
      { id: 3, score: 1 / 3 },
    ];
    assert.deepEqual(results2, expected2);

    const results3 = matcher.matches('cookies');
    const expected3 = [
      { id: 3, score: 1 / 3 },
      { id: 4, score: 1 / 3 },
    ];
    assert.deepEqual(results3, expected3);

    const results4 = matcher.matches('chocolate cookies');
    const expected4 = [
      { id: 4, score: 1.0 },
      { id: 3, score: 1 / 3 },
    ];
    assert.deepEqual(results4, expected4);
  });

  it('Exact', () => {
    const items: FuzzyItem[] = [
      { id: 1, pattern: 'exact:ice cream [cone]' },
      { id: 2, pattern: 'exact:ice cream cake' },
      { id: 3, pattern: 'exact:cookies and cream' },
      { id: 4, pattern: 'exact:chocolate chip cookies' },
    ];

    const matcher = new FuzzyTextMatcher(items.values());

    const results1 = matcher.matches('chocolate chip');
    assert.equal(results1.length, 0);

    const results2 = matcher.matches('ice cream cone');
    const expected2 = [{ id: 1, score: 3.0 }];
    assert.deepEqual(results2, expected2);

    const results3 = matcher.matches('ice cream');
    const expected3 = [{ id: 1, score: 2.0 }];
    assert.deepEqual(results3, expected3);
  });

  it('Prefix', () => {
    const items: FuzzyItem[] = [
      { id: 1, pattern: 'prefix:ice cream [cone]' },
      { id: 2, pattern: 'prefix:ice cream cake' },
      { id: 3, pattern: 'prefix:cookies and cream' },
      { id: 4, pattern: 'prefix:chocolate chip cookies' },
    ];

    const matcher = new FuzzyTextMatcher(items.values());

    const results1 = matcher.matches('chocolate cookies');
    const expected1 = [
      { id: 4, score: 1 / 3 },
      { id: 3, score: 1 / 3 },
    ];
    assert.deepEqual(results1, expected1);

    const results2 = matcher.matches('chocolate');
    const expected2 = [{ id: 4, score: 1 / 3 }];
    assert.deepEqual(results2, expected2);

    const results3 = matcher.matches('chocolate chip');
    const expected3 = [{ id: 4, score: 1 }];
    assert.deepEqual(results3, expected3);

    const results4 = matcher.matches('chip chocolate');
    const expected4 = [{ id: 4, score: 1 / 3 }];
    assert.deepEqual(results4, expected4);

    const results5 = matcher.matches('hot dog');
    assert.equal(results5.length, 0);
  });
});

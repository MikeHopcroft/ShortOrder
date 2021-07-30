import { assert } from 'chai';
import 'mocha';

import {
  choose,
  match,
  optional,
  RESULT_EXPRESSION,
} from '../../src/parser/pattern_matcher';
import { Sequence } from '../../src/parser/sequence';
import { createMock } from './mocks';

const NUMBER = 1;
const STRING = '';
const BOOL = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const alwaysTrue: any = () => true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function configure<T extends any[]>(...pattern: T) {
  const callback = createMock<
    [RESULT_EXPRESSION<typeof pattern>, number],
    boolean
  >(alwaysTrue);

  const matcher = match(...pattern).bind(callback);

  const params = () => {
    const log = callback.log();
    return log[log.length - 1].params;
  };

  return { matcher, callback, params };
}

describe('Pattern matching', () => {
  it.skip('test()', () => {
    const { callback, matcher } = configure(
      NUMBER,
      STRING,
      optional(STRING, choose(NUMBER, BOOL)),
      choose(NUMBER, STRING)
    );

    assert.isTrue(matcher(new Sequence([5, 'hi', 'there', true, 6])));
    const params1 = callback.log()[0].params;
    assert.deepEqual(params1, [[5, 'hi', ['there', true], 6], 5]);
  });

  it.skip('choose()', () => {
    const { callback, matcher, params } = configure(choose(NUMBER, STRING));

    // Match a number
    {
      const input = new Sequence([5, 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [[5], 1]);
      assert.equal(input.peek(), 6);
    }

    // Match a string
    {
      const input = new Sequence(['hello', 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [['hello'], 1]);
      assert.equal(input.peek(), 6);
    }

    // // No match due to next token
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 6]);
      assert.isFalse(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
    }

    // No match due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isFalse(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.isTrue(input.atEOS());
    }
  });

  it.skip('optional()', () => {
    const { callback, matcher, params } = configure(optional(NUMBER, STRING));

    // Match optional pattern
    {
      const input = new Sequence([5, 'hello', 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [[[5, 'hello']], 2]);
      assert.equal(input.peek(), 6);
    }

    // Match missing optional pattern.
    {
      const input = new Sequence(['hello', 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [[undefined], 0]);
      assert.equal(input.peek(), 6);
    }

    // // // No match due to next token
    // {
    //   const initialCalls = callback.log().length;
    //   const input = new Sequence([true, 6]);
    //   assert.isFalse(matcher(input));
    //   const callCount = callback.log().length - initialCalls;
    //   assert.equal(callCount, 0);
    //   assert.equal(input.peek(), true);
    // }

    // No match due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.isTrue(input.atEOS());
    }
  });
});

// Case: `foo? foo bar` when input is `foo bar`

// it('test()', () => {
//   // const pattern = createPattern(
//   //   NUMBER,
//   //   STRING,
//   //   optional(STRING, choose(NUMBER, BOOL)),
//   //   choose(NUMBER, STRING)
//   // );
//   const { callback, matcher } = configure(
//     NUMBER,
//     STRING,
//     optional(STRING, choose(NUMBER, BOOL)),
//     choose(NUMBER, STRING)
//   );
//   // const callback = createMock<
//   //   [RESULT_EXPRESSION<typeof pattern>, number],
//   //   boolean
//   // >(alwaysTrue);

//   // const matcher = match(...pattern).bind(callback);

//   assert.isTrue(matcher(new Sequence([5, 'hi', 'there', true, 6])));
//   const { params } = callback.log()[0];
//   assert.deepEqual(params, [[5, 'hi', ['there', true], 6], 5]);
//   // assert.isTrue(matched);
//   // const x = callback.log();
//   // assert.equal(x.length, 1);
//   // assert.deepEqual(x[0].params[0] as any, [5, 'hi', ['there', true], 6]);
//   // assert.equal(x[0].params[1], 5);
// });

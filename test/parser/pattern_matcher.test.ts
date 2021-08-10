import { assert } from 'chai';
import 'mocha';

import {
  choose,
  createMatcher,
  Grammar,
  optional,
  processGrammar,
  RESULT_EXPRESSION,
  star,
} from '../../src/parser/pattern_matcher';
import { Sequence } from '../../src/parser/sequence';
import { createMock } from './mocks';

const NUMBER = 1;
const STRING = '';
const BOOL = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const alwaysTrue: any = () => true;

type TestToken = string | number | boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function typesEqual(a: TestToken, b: TestToken): boolean {
  return typeof a === typeof b;
}

const match = createMatcher<TestToken, boolean>(typesEqual);

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
  it('choose', () => {
    const { callback, matcher, params } = configure(choose(NUMBER, STRING));

    // Match a number
    {
      const input = new Sequence([5, 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [[5], 1]);
      assert.equal(input.peek(), 6);
      assert.equal(input.stacksize(), 0);
    }

    // Match a string
    {
      const input = new Sequence(['hello', 6]);
      assert.isTrue(matcher(input));
      assert.deepEqual(params(), [['hello'], 1]);
      assert.equal(input.peek(), 6);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to next token
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 6]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.isTrue(input.atEOS());
      assert.equal(input.stacksize(), 0);
    }
  });

  it('optional', () => {
    const { callback, matcher, params } = configure(optional(NUMBER, STRING));

    // Match optional pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([5, 'hello', 6]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[[5, 'hello']], 2]);
      assert.equal(input.peek(), 6);
      assert.equal(input.stacksize(), 0);
    }

    // Match missing optional pattern.
    {
      const initialCalls = callback.log().length;
      const input = new Sequence(['hello', 6]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[undefined], 0]);
      assert.equal(input.peek(), 'hello');
      assert.equal(input.stacksize(), 0);
    }

    // Match missing optional pattern due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[undefined], 0]);
      assert.equal(input.stacksize(), 0);
      assert.isTrue(input.atEOS());
    }
  });

  it('sequence', () => {
    const { callback, matcher, params } = configure(BOOL, NUMBER, STRING);

    // Match sequential pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 1, 'hello', 2]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[true, 1, 'hello'], 3]);
      assert.equal(input.peek(), 2);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to next token
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 6, 7]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 6]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }
  });

  it('sequence - empty', () => {
    const { callback, matcher, params } = configure();

    // Match sequential pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 1, 'hello', 2]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[], 0]);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    // End of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[], 0]);
      assert.isTrue(input.atEOS());
      assert.equal(input.stacksize(), 0);
    }
  });

  it('star', () => {
    const { callback, matcher, params } = configure(star(NUMBER, STRING));

    // Match one instance of star pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([5, 'hello', 6]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[[[5, 'hello']]], 2]);
      assert.equal(input.peek(), 6);
      assert.equal(input.stacksize(), 0);
    }

    // Match two instances of star pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([5, 'hello', 6, 'world', 7]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [
        [
          [
            [5, 'hello'],
            [6, 'world'],
          ],
        ],
        4,
      ]);
      assert.equal(input.peek(), 7);
      assert.equal(input.stacksize(), 0);
    }

    // Match zero instances of star pattern
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 5, 'hello', 6]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[[]], 0]);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    // Match zero instances of star pattern due to end of stream.
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[[]], 0]);
      assert.isTrue(input.atEOS());
      assert.equal(input.stacksize(), 0);
    }
  });

  it('test', () => {
    {
      const input = new Sequence([true, 1, 'hello', 2]);
      assert.isTrue(match(BOOL, NUMBER, STRING).test(input));
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    {
      const input = new Sequence([true, 1, 'hello', 2]);
      assert.isFalse(match(NUMBER, STRING).test(input));
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }
  });

  it('nested', () => {
    const { callback, matcher, params } = configure(
      BOOL,
      optional(NUMBER, choose(BOOL, STRING)),
      choose(NUMBER, STRING)
    );

    // Match pattern case I
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 1, false, 'hello', 123]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[true, [1, false], 'hello'], 4]);
      assert.equal(input.peek(), 123);
      assert.equal(input.stacksize(), 0);
    }

    // Match pattern case II
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, 456, 123]);
      assert.isTrue(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 1);
      assert.deepEqual(params(), [[true, undefined, 456], 2]);
      assert.equal(input.peek(), 123);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to next token
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true, true, 456, 'hello', 123]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }

    // No match due to end of stream
    {
      const initialCalls = callback.log().length;
      const input = new Sequence([true]);
      assert.isUndefined(matcher(input));
      const callCount = callback.log().length - initialCalls;
      assert.equal(callCount, 0);
      assert.equal(input.peek(), true);
      assert.equal(input.stacksize(), 0);
    }
  });

  it('grammar', () => {
    const lines: string[] = [];

    function makeCallback(id: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (args: any[], size: number) => {
        lines.push(`${id}: args=${JSON.stringify(args)}, size=${size}`);
        return true;
      };
    }
    const callback1 = makeCallback(1);
    const callback2 = makeCallback(2);
    const callback3 = makeCallback(3);
    const callback4 = makeCallback(4);

    const grammar: Grammar<boolean> = [
      match(NUMBER, STRING).bind(callback1),
      match(optional(BOOL, STRING), NUMBER).bind(callback2),
      match(NUMBER, NUMBER).bind(callback3),
      match(choose(NUMBER, BOOL), BOOL).bind(callback4),
    ];

    const input = new Sequence([
      true,
      'one',
      1,
      2,
      3,
      'four',
      5,
      false,
      'five',
      456,
    ]);

    while (processGrammar(grammar, input));

    // for (const line of lines) {
    //   console.log(line);
    // }

    const expected = [
      '2: args=[[true,"one"],1], size=3',
      '2: args=[null,2], size=1',
      '1: args=[3,"four"], size=2',
      '2: args=[null,5], size=1',
      '2: args=[[false,"five"],456], size=3',
    ];

    assert.deepEqual(lines, expected);
    assert.equal(input.stacksize(), 0);
  });
});

// Case: `foo? foo bar` when input is `foo bar`

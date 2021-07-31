// Derived from experiment.ts
//   1. Import ISequence.
//   2. Import Token. Switch Token.type from string to Symbol.
//   3. Mixin Span type
//
// Works. Next steps:
//   1. OK: Clean up.
//   2. FAILED: Investigate using instanceof for operators.
//      Seems to cause ''OptionalToken<T extends {}[]> extends Token' seems to work.'
//   3. OK: Make operator tokens unrelated to token-flow's token.
//   4. OK: Converting OptionalToken<T extends Token[]> to OptionalToken<T extends any[]>
//      leads to 'Type instantiation is excessively deep and possibly infinite.'
//      'OptionalToken<T extends {}[]> extends Token' seems to work.
//      'OptionalToken<T extends {}[]>' seems to work.
//   5. OK: equality function for matchSequence. Probably need to use curried function
//      approach.
//   6. Design for optional(x) and optional(x, y). Do they both need to return array | undefined?
//      Can the first one return typeof(x) | undefined?
//   7. OK: Unit tests
//   8. Case of pattern = 'foo? foo bar' and input = 'foo bar'
//   9. Case of pattern = []. Should this match everything, nothing, or EOS?
//  10. Match start, match end
//  11. Plus and star.

import { ISequence } from './sequence';

///////////////////////////////////////////////////////////////////////////////
//
// Useful type functions
//
///////////////////////////////////////////////////////////////////////////////
export type MIXIN<T, M> = {
  [P in keyof T]: T[P] extends [...infer A] | undefined
    ? MIXIN<A, M> | undefined
    : T[P] & M;
};

///////////////////////////////////////////////////////////////////////////////
//
// Operator POJOs - works
//
///////////////////////////////////////////////////////////////////////////////
// DESIGN NOTE: to ensure that user tokens can never collide with operator
// tokens,
//   1. Use Symbol() to generate type value instead of Symbol.for() so that the
//      user can never create the same symbol.
//   2. Don't export symbol.

const OPTIONAL: unique symbol = Symbol();
// export const OPTIONAL: unique symbol = Symbol.for('OPTIONAL');
type OPTIONAL = typeof OPTIONAL;

interface OptionalToken<T extends {}[]> {
  type: OPTIONAL;
  children: T;
}

export function optional<T extends {}[]>(...args: T): OptionalToken<T> {
  return {
    type: OPTIONAL,
    children: args,
  };
}

const CHOOSE: unique symbol = Symbol();
// export const CHOOSE: unique symbol = Symbol.for('CHOOSE');
type CHOOSE = typeof CHOOSE;

interface ChooseToken<T extends {}[]> {
  type: CHOOSE;
  children: T;
}

export function choose<T extends {}[]>(...args: T): ChooseToken<T> {
  return {
    type: CHOOSE,
    children: args,
  };
}

type OperatorToken =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | OptionalToken<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ChooseToken<any>;

///////////////////////////////////////////////////////////////////////////////
//
// Matcher
//
///////////////////////////////////////////////////////////////////////////////
type RESULT_ELEMENT<T> = T extends OptionalToken<infer A>
  ? RESULT_EXPRESSION<A> | undefined
  : T extends ChooseToken<infer B>
  ? RESULT_EXPRESSION<B>[number]
  : T;

export type RESULT_EXPRESSION<T> = { [P in keyof T]: RESULT_ELEMENT<T[P]> };

type binding<T, RESULT> = (
  result: RESULT_EXPRESSION<T>,
  size: number
) => RESULT;

export type PatternMatcher<RESULT> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens: ISequence<any>
) => RESULT | undefined;

export type EqualityPredicate<T> = (a: T, b: T) => boolean;

export function createMatcher<ANYTOKEN, RESULT>(
  equality: EqualityPredicate<ANYTOKEN>
) {
  return match;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function match<T extends any[]>(
    ...pattern: T
  ): { bind: (processor: binding<T, RESULT>) => PatternMatcher<RESULT> } {
    return {
      bind:
        (processor: binding<T, RESULT>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (input: ISequence<any>): RESULT | undefined => {
          const used0 = input.itemsUsed();
          const m = matchSequence(pattern, input);
          if (m !== undefined) {
            const size = input.itemsUsed() - used0;
            return processor(m, size);
          } else {
            return undefined;
          }
        },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function matchSequence<T extends any[]>(
    pattern: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: ISequence<any>
  ): RESULT_EXPRESSION<T> | undefined {
    input.mark();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const temp: any[] = [];
    let result = temp as RESULT_EXPRESSION<T> | undefined;
    // TODO: INVESTIGATE why following line won't work.
    // let result: RESULT_EXPRESSION<T> | undefined = [];
    for (const token of pattern) {
      const op = token as OperatorToken;
      if (op.type === OPTIONAL) {
        // NOTE: perform check for OPTIONAL before input.atEOS()
        // because it is legal to match an OPTIONAL token to the
        // end of stream.
        const m = matchOptional(op.children, input);
        result!.push(m);
      } else if (input.atEOS()) {
        result = undefined;
        break;
      } else if (op.type === CHOOSE) {
        const m = matchChoose(op.children, input);
        if (m !== undefined) {
          result!.push(m);
        } else {
          result = undefined;
          break;
        }
      } else {
        const next = input.peek();
        if (equality(token, next)) {
          result!.push(next);
          input.take();
        } else {
          result = undefined;
          break;
        }
      }
    }
    if (result === undefined) {
      input.restore();
    }
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function matchChoose<T extends any[]>(
    pattern: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: ISequence<any>
  ): RESULT_EXPRESSION<T>[number] | undefined {
    for (const choice of pattern) {
      input.mark();
      const m = matchSequence([choice], input);
      if (m !== undefined) {
        return m[0];
      }
      input.restore();
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function matchOptional<T extends any[]>(
    pattern: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: ISequence<any>
  ): RESULT_EXPRESSION<T> | undefined {
    input.mark();
    const m = matchSequence(pattern, input);
    if (m === undefined) {
      input.restore();
      return undefined;
    } else {
      return m;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// Grammar
//
///////////////////////////////////////////////////////////////////////////////
export type Grammar<RESULT> = PatternMatcher<RESULT>[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processGrammar<RESULT>(
  grammar: Grammar<RESULT>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: ISequence<any>
): boolean {
  for (const matcher of grammar) {
    if (matcher(input)) {
      return true;
    }
  }
  return false;
}

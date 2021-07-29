// Derived from experiment.ts
//   1. Import ISequence.
//   2. Import Token. Switch Token.type from string to Symbol.
//   3. Mixin Span type
//
// Works. Next steps:
//   1. WIP: Clean up.
//   2. FAILED: Investigate using instanceof for operators.
//      Seems to cause ''OptionalToken<T extends {}[]> extends Token' seems to work.'
//   3. OK: Make operator tokens unrelated to token-flow's token.
//   4. OK: Converting OptionalToken<T extends Token[]> to OptionalToken<T extends any[]>
//      leads to 'Type instantiation is excessively deep and possibly infinite.'
//      'OptionalToken<T extends {}[]> extends Token' seems to work.
//      'OptionalToken<T extends {}[]>' seems to work.
//   5. WIP: equality function for matchSequence. Probably need to use curried function
//      approach.

import { Token } from 'token-flow';

import { ISequence, Sequence } from './sequence';

///////////////////////////////////////////////////////////////////////////////
//
// User tokens
//
///////////////////////////////////////////////////////////////////////////////
export const TOKEN_A: unique symbol = Symbol.for('TOKEN_A');
export type TOKEN_A = typeof TOKEN_A;

interface TokenA extends Token {
  type: TOKEN_A;
  count: number;
}

function a(count: number): TokenA {
  return { type: TOKEN_A, count };
}

const A = { type: TOKEN_A } as TokenA;

export const TOKEN_B: unique symbol = Symbol.for('TOKEN_B');
export type TOKEN_B = typeof TOKEN_B;

interface TokenB extends Token {
  type: TOKEN_B;
  value: string;
}

function b(value: string): TokenB {
  return { type: TOKEN_B, value };
}

const B = { type: TOKEN_B } as TokenB;

export const TOKEN_C: unique symbol = Symbol.for('TOKEN_C');
export type TOKEN_C = typeof TOKEN_C;

interface TokenC extends Token {
  type: TOKEN_C;
  correct: boolean;
  value: string;
}

const C = { type: TOKEN_C } as TokenC;

function c(correct: boolean, value: string): TokenC {
  return { type: TOKEN_C, correct, value };
}

///////////////////////////////////////////////////////////////////////////////
//
// Useful type functions
//
///////////////////////////////////////////////////////////////////////////////
// // This version compiles but intellisense is wrong
// export type MIXIN<T, M> = {
//   [P in keyof T]: T[P] extends [infer A] | undefined
//     ? MIXIN<A, M> | undefined
//     : T[P] & M;
// };

// This version causes compile error, but works for intellisense
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
export type OPTIONAL = typeof OPTIONAL;

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
export type CHOOSE = typeof CHOOSE;

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

///////////////////////////////////////////////////////////////////////////////
//
// Operator classes - infinite recursion
//
///////////////////////////////////////////////////////////////////////////////
// export const OPERATOR: unique symbol = Symbol.for('OPERATOR');
// export type OPERATOR = typeof OPERATOR;

// class OptionalToken<T extends any[]> implements Token {
//   readonly type = OPERATOR;
//   readonly pattern: T;

//   constructor(...pattern: T) {
//     this.pattern = pattern;
//   }
// }

// function optional<T extends any[]>(...pattern: T) {
//   return new OptionalToken(...pattern);
// }

// class ChooseToken<T extends any[]> implements Token {
//   readonly type = OPERATOR;
//   readonly pattern: T;

//   constructor(...pattern: T) {
//     this.pattern = pattern;
//   }
// }

// function choose<T extends any[]>(...pattern: T) {
//   return new ChooseToken(...pattern);
// }

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

type RESULT_EXPRESSION<T> = { [P in keyof T]: RESULT_ELEMENT<T[P]> };

type binding<T> = (result: RESULT_EXPRESSION<T>, size: number) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PatternMatcher = (tokens: ISequence<any>) => boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function match<T extends any[]>(
  ...pattern: T
): { bind: (processor: binding<T>) => PatternMatcher } {
  // console.log(`match(${JSON.stringify(pattern, null, 2)},`);

  return {
    bind:
      (processor: binding<T>) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (input: ISequence<any>): boolean => {
        const used0 = input.itemsUsed();
        const m = matchSequence(pattern, input);
        if (m !== undefined) {
          const size = input.itemsUsed() - used0;
          return processor(m, size);
        } else {
          return false;
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
  // console.log(`matchSequence(${JSON.stringify(pattern, null, 2)},`);
  // console.log(`${JSON.stringify((input as any).values, null, 2)})`);
  input.mark();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const temp: any[] = [];
  let result = temp as RESULT_EXPRESSION<T> | undefined;
  // let result: RESULT_EXPRESSION<T> | undefined = [];
  for (const token of pattern) {
    const op = token as OperatorToken;
    if (input.atEOS()) {
      result = undefined;
      break;
    } else if (op.type === OPTIONAL) {
      const m = matchOptional(op.children, input);
      result!.push(m);
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
      if (token.type === next.type) {
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
  // console.log(`matchChoose()`);
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
  // console.log(`matchOptional()`);
  input.mark();
  const m = matchSequence(pattern, input);
  if (m === undefined) {
    input.restore();
    return undefined;
  } else {
    return m;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// Grammar
//
///////////////////////////////////////////////////////////////////////////////
export type Grammar = PatternMatcher[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processGrammar(
  grammar: Grammar,
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

///////////////////////////////////////////////////////////////////////////////
//
// Sample usage
//
///////////////////////////////////////////////////////////////////////////////

const a1 = a(1);
const a2 = a(2);
const b1 = b('b1');
const b2 = b('b2');
// const c1 = c(true, 'c1 is true');
const c2 = c(false, 'c1 is false');

function summarize(
  x: [TokenA, TokenB, [TokenB, TokenA | TokenC] | undefined, TokenA | TokenB],
  size: number
): boolean {
  console.log(`============ summarize(${size}) =============`);
  console.log(JSON.stringify(x, null, 2));

  // type ADD_SPAN_ELEMENT<T> = T extends Array<infer A> ? ADD_SPAN_EXPRESSION<A> : T & Span;
  // type ADD_SPAN_EXPRESSION<T> = { [P in keyof T]: ADD_SPAN_ELEMENT<T[P]>};
  // type ADD_SPAN_EXPRESSION<T> = { [P in keyof T]: T[P] extends Array<infer A> ? ADD_SPAN_EXPRESSION<A> : T[P] & Span;

  // type ADD_SPAN_EXPRESSION<T> = { [P in keyof T]: T[P] extends  [...(infer A)] | undefined ? number : boolean }; //T[P] & Span;
  // type MIXIN<T, M> = { [P in keyof T]: T[P] extends  [...(infer A)] | undefined ? MIXIN<A, M> | undefined : T[P] & M }; //;

  // const zz = <const>[1, 2, [3, 4], 5];
  // const zzz = zz as unknown as MIXIN<typeof zz, Span>;
  // const y = x as unknown as MIXIN<typeof x, Span>;
  return true;
}

// TODO: ISSUE: ambiguity of [optional(foo), foo]
// TODO: predefined pattern matcher to skip one token of any type
// TODO: EntityBuilder needs number of tokens matched (e.g. for optionTokensCount)

export function go() {
  console.log(`a1 = ${a1}`);
  const matcher = match(A, B, optional(B, choose(A, C)), choose(A, B)).bind(
    summarize
  );

  matcher(new Sequence([a1, b1, b2, c2, a2]));
  matcher(new Sequence([a1, b1, a2]));
  matcher(new Sequence([b1, b1, b2, c2, a2])); // Never calls summarize.

  // Example of matching nothing.
  // const matcher2 = match().bind((x) => true);
}

function go2() {
  function summarize2(
    x: [
      number,
      string,
      [string, number | boolean] | undefined,
      number | string
    ],
    size: number
  ): boolean {
    console.log(`============ summarize(${size}) =============`);
    console.log(JSON.stringify(x, null, 2));
    return true;
  }

  const NUMBER = 1;
  const STRING = '';
  const BOOL = true;
  const matcher = match(
    NUMBER,
    STRING,
    optional(STRING, choose(NUMBER, BOOL)),
    choose(NUMBER, STRING)
  ).bind(summarize2);
  matcher(new Sequence([5, 'hi', 'there', true, 6]));
}

go2();

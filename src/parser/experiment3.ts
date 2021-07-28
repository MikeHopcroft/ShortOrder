///////////////////////////////////////////////////////////////////////////////
//
// ISequence and Sequence
//
///////////////////////////////////////////////////////////////////////////////
interface ISequence<T> {
  mark(): void;
  restore(): void;
  peek(): T;
  take(): void;
  discard(): void;
  atEOS(): boolean;
}

class Sequence<T> implements ISequence<T> {
  private readonly values: T[];
  private cursor = 0;
  private used = 0;
  private readonly checkpoints: Array<[number, number]> = [];

  constructor(values: T[]) {
    this.values = values;
  }

  mark() {
    this.checkpoints.push([this.cursor, this.used]);
  }

  restore() {
    const checkpoint = this.checkpoints.pop();
    if (checkpoint) {
      [this.cursor, this.used] = checkpoint;
    } else {
      const message = 'Checkpoint stack underflow.';
      throw new TypeError(message);
    }
  }

  peek(): T {
    if (this.atEOS()) {
      const message = 'Attempted peek() at end of stream.';
      throw new TypeError(message);
    }
    return this.values[this.cursor];
  }

  take(): void {
    if (this.atEOS()) {
      const message = 'Attempted take() at end of stream.';
      throw new TypeError(message);
    }
    ++this.cursor;
    ++this.used;
  }

  discard(): void {
    if (this.atEOS()) {
      const message = 'Attempted discard() at end of stream.';
      throw new TypeError(message);
    }
    ++this.cursor;
  }

  atEOS(): boolean {
    return this.cursor >= this.values.length;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// User tokens
//
///////////////////////////////////////////////////////////////////////////////
interface Token {
  type: string;
}

interface TokenA extends Token {
  type: 'a';
  count: number;
}

function a(count: number): TokenA {
  return { type: 'a', count };
}

const A = { type: 'a' } as TokenA;
// const A = undefined as unknown as TokenA;

interface TokenB extends Token {
  type: 'b';
  value: string;
}

function b(value: string): TokenB {
  return { type: 'b', value };
}

const B = { type: 'b' } as TokenB;
// const B = undefined as unknown as TokenB;

interface TokenC extends Token {
  type: 'c';
  correct: boolean;
  value: string;
}

const C = { type: 'c' } as TokenC;
// const C = undefined as unknown as TokenC;

function c(correct: boolean, value: string): TokenC {
  return { type: 'c', correct, value };
}

///////////////////////////////////////////////////////////////////////////////
//
// Operator tokens
//
///////////////////////////////////////////////////////////////////////////////
interface OptionalToken<T extends Token[]> extends Token {
  type: 'optional';
  tokens: T;
}

interface ChooseToken<T extends Token[]> extends Token {
  type: 'choose';
  tokens: T;
}

function optional<T extends Token[]>(...args: T): OptionalToken<T> {
  return {
    type: 'optional',
    tokens: args,
  };
}

function choose<T extends Token[]>(...args: T): ChooseToken<T> {
  return {
    type: 'choose',
    tokens: args,
  };
}

type AnyToken =
  | TokenA
  | TokenB
  | TokenC
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

type binding<T> = (result: RESULT_EXPRESSION<T>) => boolean;
type PatternMatcher = (tokens: ISequence<AnyToken>) => boolean;

function match<T extends AnyToken[]>(
  ...pattern: T
): { bind: (processor: binding<T>) => PatternMatcher } {
  // console.log(`match(${JSON.stringify(pattern, null, 2)},`);

  return {
    bind:
      (processor: binding<T>) =>
      (input: ISequence<AnyToken>): boolean => {
        const m = matchSequence(pattern, input);
        if (m !== undefined) {
          return processor(m);
        } else {
          return false;
        }
      },
  };
}

function matchSequence<T extends AnyToken[]>(
  pattern: T,
  input: ISequence<AnyToken>
): RESULT_EXPRESSION<T> | undefined {
  // console.log(`matchSequence(${JSON.stringify(pattern, null, 2)},`);
  // console.log(`${JSON.stringify((input as any).values, null, 2)})`);
  input.mark();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const temp: any[] = [];
  let result = temp as RESULT_EXPRESSION<T> | undefined;
  // let result: RESULT_EXPRESSION<T> | undefined = [];
  for (const token of pattern) {
    if (input.atEOS()) {
      result = undefined;
      break;
    } else if (token.type === 'optional') {
      const m = matchOptional(token.tokens, input);
      result!.push(m);
    } else if (token.type === 'choose') {
      const m = matchChoose(token.tokens, input);
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

function matchChoose<T extends AnyToken[]>(
  pattern: T,
  input: ISequence<AnyToken>
) {
  // ): RESULT_EXPRESSION<T>[number] | undefined {
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

function matchOptional<T extends AnyToken[]>(
  pattern: T,
  input: ISequence<AnyToken>
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
  x: [Token, TokenB, [TokenB, TokenA | TokenC] | undefined, TokenA | TokenB]
): boolean {
  console.log('============ summarize =============');
  console.log(JSON.stringify(x, null, 2));
  return true;
}

// TODO: ISSUE: ambiguity of [optional(foo), foo]

function go() {
  console.log(`a1 = ${a1}`);
  const matcher = match(A, B, optional(B, choose(A, C)), choose(A, B)).bind(
    summarize
  );

  matcher(new Sequence([a1, b1, b2, c2, a2]));
  matcher(new Sequence([a1, b1, a2]));
  matcher(new Sequence([b1, b1, b2, c2, a2])); // Never calls summarize.
}

go();

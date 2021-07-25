import { GapToken, ProductToken, ProductToken0, ProductToken1, SequenceToken } from './interfaces';
import { TokenSequence } from './token_sequence';

/******************************************************************************
 * 
 * Pattern matching prototype
 * 
 ******************************************************************************/


/******************************************************************************
 * 
 * Types and functions
 * 
 ******************************************************************************/
const productParts0 = undefined as unknown as ProductToken0;
const productParts1 = undefined as unknown as ProductToken1;
export type GeneralToken =
  ProductToken | SequenceToken | GapToken;

type Pattern = (s: TokenSequence<GeneralToken>) => boolean;

function match<T extends ([GeneralToken] | GeneralToken[])>(
  tokens: T,
  f: (t: T) => boolean
): Pattern {
  // return [tokens, f];
  return (s: TokenSequence<GeneralToken>) => {
    if (s.startsWith(tokens.map(x => x.type))) {
      const actual = s.tokens.slice(tokens.length) as T;
      // TODO: right here, save f() success code and use to
      // determine whether to take() tokens from sequence
      // before returning.
      return f(actual);
    }
    return false;
  };
}

// DESIGN NOTES:
//   1. Need a slightly different TokenSequence API that allows extraction
//      of slice from cursor.
//   2. Need some way to commit/rollback cursor, depending on success of match.
//      Could side-effect TokenSequence or produce modified copy. In the latter
//      case, the pattern would return the new TokenSequence on success,
//      otherwise null.
//   3. May need hierarchical commit/rollback for nested processors.
//   4. Might want to template match() and process by pattern return type.
//      This would allow returning an object with interpretation and
//      updated sequence. Might need some sort of way of passing the return
//      value corresponding to false (e.g. nop interpretation).
//   5. Think about ways to compose parsers.
//   6. Functions for chaining interpretations (add scores)
//   7. Functions for accumulating interpretations (pick max score)
function process(patterns: Pattern[], tokens: TokenSequence<GeneralToken>): boolean {
  for (const pattern of patterns) {
    if (pattern(tokens)) {
      return true;
    }
  }
  return false;
}

// Operator tokens
//   question(token: T) => T | undefined
//   plus(token: T) => T[]
//   star(token: T) => T[] | undefined
// The sequence operator is used for grouping
//   sequence(...) => ...
// The oneOf() or set-member() operator

/******************************************************************************
 * 
 * Usage example
 * 
 ******************************************************************************/
function process0(token: ProductToken0): boolean {
  return true;
}

function process1(token: ProductToken1): boolean {
  return true;
}

function process0and1(token0: ProductToken0, token1: ProductToken1): boolean {
  return true;
}

const templates = [
  match([productParts0, productParts1], ([a, ]) => process0(a)),
  match([productParts0, productParts1], ([, b]) => process1(b)),
  match([productParts0, productParts1], ([a, b]) => process0and1(a, b)),
];

const sequence = undefined as unknown as TokenSequence<GeneralToken>;

const success = process(templates,sequence);






// const x = match(
//   [productParts0, productParts1],
//   ([a,b]) => process0(a)
// );

// //      const a: AnyToken[] = tags.map(x => ({type: x}));
//   const a = [1, 'hi'].map(x => ({value: x}));
//   // const c = [1, 'hi'];

//   // const tupleArray = <T extends ([any] | any[])[]>(args: T): T => args;
//   const tupleArray = <T extends Array<([any] | any[])>(args: T): T => args;
//   // const tupleArray = <T extends (any[])>(args: T): T => args;
//   const b = tupleArray([["A", 1], ["B", 2]]); // [string, number][]

//   const tuple = <T extends ([any] | any[])>(args: T): T => args;
//   const c = tuple([1, 'hi']);
// }


// function foo<T extends ([GeneralToken] | GeneralToken[])>(
//   tokens: T
// ):T {
//   const a = foo(
//     [productParts0, productParts1]
//   );
//   return tokens;
// }

// // https://stackoverflow.com/questions/48872328/infer-tuple-type-instead-of-union-type
// function bar<T extends ([GeneralToken] | GeneralToken[])>(
//   tokens: T,
//   f: (t: T) => void
// ):T {
//   function baz(token: ProductToken0) {

//   }

//   const a = bar(
//     [productParts0, productParts1],
//     ([a,b]) => {
//       baz(a);
//     }
//     // (t) => {
//     //   baz(t[0]);
//     // }
//   );
//   return tokens;
// }

// type foobar = typeof match<[ProductToken1]>;

// type MatchParams = Parameters<typeof match>;

// function match<T extends ([GeneralToken] | GeneralToken[])>(
//   tokens: T,
//   f: (t: T) => boolean
// ): boolean {
//   return f(tokens);
// }


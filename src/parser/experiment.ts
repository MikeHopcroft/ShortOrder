// import { X_OK } from 'constants';
// import { Token } from 'token-flow';
// import { WordX } from '../fuzzer';

// import {
//   GapToken,
//   ProductToken,
//   ProductToken0,
//   ProductToken1,
//   SequenceToken,
// } from './interfaces';

// import { TokenSequence } from './token_sequence';

// /******************************************************************************
//  *
//  * Pattern matching prototype
//  *
//  ******************************************************************************/

// /******************************************************************************
//  *
//  * Types and functions
//  *
//  ******************************************************************************/
// // A seqeunce of SequenceToken that does not include two or more ENTITY tokens.
// // export const QUESTION: unique symbol = Symbol('QUESTION');
// // export type QUESTION = typeof QUESTION;
// // export interface QuestionToken<T extends [GeneralToken] | GeneralToken[]> extends Token {
// //   type: QUESTION;
// //   tokens: T;
// // }

// // type ToNumber<T> = { -readonly [P in keyof T]: number };
// // type Writeable<T> = { -readonly [P in keyof T]: T[P] };
// // function X<T>(args: T): T {

// // }
// // let a: Writeable<[1, 'a']>;
// // let b: ToNumber<[1, 'a']>;
// // let c = X(<const>['a', 1, X(<const>[3]));

// // function question<T extends [GeneralToken] | GeneralToken[]>(pattern: T): QuestionToken<T> {
// //   return {
// //     type: QUESTION,
// //     tokens: pattern
// //   }
// // }
// // function tuple<T extends [GeneralToken] | GeneralToken[]>(tuple: T): T {
// //   return tuple;
// // }

// // function question<T>(pattern: T): QuestionToken<T> {
// //   return {
// //     type: QUESTION,
// //     tokens: pattern
// //   };
// // }
// // // function question<T extends [GeneralToken] | GeneralToken[]>(pattern: T): T {
// // //   return pattern;
// // // }

// const productParts0 = undefined as unknown as ProductToken0;
// const productParts1 = undefined as unknown as ProductToken1;
// export type GeneralToken =
//   | ProductToken
//   | SequenceToken
//   | GapToken
//   | QuestionToken<any>;

// type Pattern = (s: TokenSequence<GeneralToken>) => boolean;

// function match<T extends [GeneralToken] | GeneralToken[]>(
//   pattern: T,
//   bindings: (t: T) => boolean
// ): Pattern {
//   // return [tokens, f];
//   return (s: TokenSequence<GeneralToken>) => {
//     s.mark();
//     for (const token of pattern) {
//       if (token.type === QUESTION) {
//       } else {
//       }
//     }

//     if (s.startsWith(pattern.map((x) => x.type))) {
//       const actual = s.tokens.slice(pattern.length) as T;
//       // TODO: right here, save f() success code and use to
//       // determine whether to take() tokens from sequence
//       // before returning.
//       return bindings(actual);
//     }
//     return false;
//   };
// }

// // function matchPattern(
// //   tokens: TokenSequence<GeneralToken>,
// //   pattern: GeneralToken[]
// // ): GeneralToken[] {
// //   const match: GeneralToken[] = [];
// //   for (const token of pattern) {
// //     if (token.type === QUESTION) {
// //     } else {
// //       // Literal match
// //     }
// //   }
// // }

// // DESIGN NOTES:
// //   1. Need a slightly different TokenSequence API that allows extraction
// //      of slice from cursor.
// //   2. Need some way to commit/rollback cursor, depending on success of match.
// //      Could side-effect TokenSequence or produce modified copy. In the latter
// //      case, the pattern would return the new TokenSequence on success,
// //      otherwise null.
// //   3. May need hierarchical commit/rollback for nested processors.
// //   4. Might want to template match() and process by pattern return type.
// //      This would allow returning an object with interpretation and
// //      updated sequence. Might need some sort of way of passing the return
// //      value corresponding to false (e.g. nop interpretation).
// //   5. Think about ways to compose parsers.
// //   6. Functions for chaining interpretations (add scores)
// //   7. Functions for accumulating interpretations (pick max score)
// function process(
//   patterns: Pattern[],
//   tokens: TokenSequence<GeneralToken>
// ): boolean {
//   for (const pattern of patterns) {
//     if (pattern(tokens)) {
//       return true;
//     }
//   }
//   return false;
// }

// // Operator tokens
// //   question(token: T) => T | undefined
// //   plus(token: T) => T[]
// //   star(token: T) => T[] | undefined
// // The sequence operator is used for grouping
// //   sequence(...) => ...
// // The oneOf() or set-member() operator

// /******************************************************************************
//  *
//  * Usage example
//  *
//  ******************************************************************************/
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function process0(token: ProductToken0): boolean {
//   return true;
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function process1(token: ProductToken1): boolean {
//   return true;
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function process0and1(token0: ProductToken0, token1: ProductToken1): boolean {
//   return true;
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function go() {
//   const a = tuple([productParts0, productParts1]);
//   const b = [productParts0, productParts1] as const;
//   //const c = <const> question([productParts0, productParts1]);

//   const templates = [
//     match([productParts0, productParts1], ([a]) => process0(a)),
//     match([productParts0, productParts1], ([, b]) => process1(b)),
//     match([productParts0, productParts1], ([a, b]) => process0and1(a, b)),
//     match([question(<const>[productParts0, productParts1]), productParts1], ([a, b]) => process0and1(a, b)),
//     // match([<const>question([productParts0, productParts1]), productParts1], ([a, b]) => process0and1(a, b)),
//     match([question(tuple([productParts0, productParts1])), productParts1], ([a, b]) => process0and1(a, b)),
//     match([question(b), productParts1], ([a, b]) => process0and1(a, b)),
//   ];

//   const sequence = undefined as unknown as TokenSequence<GeneralToken>;

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const success = process(templates, sequence);
// }

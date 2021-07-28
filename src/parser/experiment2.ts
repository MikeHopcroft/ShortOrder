// interface Token {
//   type: string;
// }

// interface TokenA extends Token {
//   type: 'a';
//   count: number;
// }

// const A = undefined as unknown as TokenA;

// interface TokenB extends Token {
//   type: 'b';
//   value: string;
// }

// const B = undefined as unknown as TokenB;

// interface TokenC extends Token {
//   type: 'c';
//   correct: boolean;
//   value: string;
// }

// const C = undefined as unknown as TokenC;

// type TokenLiteral = TokenA | TokenB | TokenC;
// type AnyToken = TokenLiteral | OptionalToken;

// interface OptionalToken<T extends AnyToken[]> extends Token {
//   type: 'optional';
//   tokens: T;
// }

// function choose2<T extends any[]>(...args: T): T[number] {
// }

// function optional2<T extends any[]>(...args: T): T | undefined {
// }

// function optional3<T extends AnyToken[]>(...args: T): OptionalToken<T> {
//   return {
//     type: 'optional',
//     tokens: args
//   }
// }

// function optionType<T extends AnyToken[]>(o: OptionalToken<T>): T {
// }

// type OPTION_TYPE<T extends AnyToken[]> = T;

// // type ELEMENT<T> = T extends {type: 'optional'} ? T | undefined : T;
// // type ELEMENT<infer S extends AnyToken[], T extends TokenLiteral | OptionalToken<S>> =
// //   T extends {type: 'optional'} ? T['tokens'] | undefined : T;
// type ELEMENT<T> = T extends OptionalToken<infer S> ? S | undefined : T;
// type CONVERT<T> = { [P in keyof T]: ELEMENT<T[P]> };

// function convert<T extends AnyToken[]>(...args: T): CONVERT<T> {

// }

// // const pattern2 = <const>[A, B, optional2(B, choose2(A, C)), choose2(A, B)];
// const pattern3 = <const>[A, B, optional3(B, choose2(A, C)), choose2(A, B)];
// const result = convert(...pattern3);
// const result2 = convert(A, optional3(B, choose2(A, C)));
// const result3 = convert(A, B, optional3(B, choose2(A, C)), choose2(A, B));

// // function optional<T>(args: T): T | undefined {
// // }
// // function choose<T extends any[]>(args: T): T[number] {
// // }
// // const pattern = <const>[A, B, optional(<const>[B, choose([A, C])]), choose([A, B])];
// // type ListElementTypeUnion<T extends any[]> = T[number];
// // type OPTIONAL<T> = { [P in keyof T]: Partial<T[P]> }
// // function choose<T>(args: T): ListElementTypeUnion<T> {
// // }

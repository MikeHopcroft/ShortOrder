export const fooQuantity = 0;

// import * as fs from 'fs';
// import { itemMapFromYamlString, Item, PatternRecognizer } from 'token-flow';
// import { CompositeToken, PID, StemmerFunction, Tokenizer, Token } from 'token-flow';

// export const QUANTITY: unique symbol = Symbol('QUANTITY');
// export type QUANTITY = typeof QUANTITY;

// export interface QuantityToken extends CompositeToken {
//     type: QUANTITY;
//     children: Token[];
//     value: number;
// }

// export type QuantityRecognizer = PatternRecognizer<Item>;

// export function CreateQuantityRecognizer(
//     quantityFile: string,
//     downstreamWords: Set<string>,
//     stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
//     debugMode = false
// ): QuantityRecognizer {
//     const items = itemMapFromYamlString(fs.readFileSync(quantityFile, 'utf8'));

//     const tokenFactory = (id: PID, children: Token[]): QuantityToken => {
//         return { type: QUANTITY, children, value: id };
//     };

//     return new PatternRecognizer(items, tokenFactory, downstreamWords, stemmer, false, true, debugMode);
// }

export const fooAttrib = 0;
// import * as fs from 'fs';
// import { itemMapFromYamlString, Item, PatternRecognizer } from 'token-flow';
// import { CompositeToken, PID, StemmerFunction, Token, Tokenizer } from 'token-flow';

// export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
// export type ATTRIBUTE = typeof ATTRIBUTE;

// export interface AttributeToken extends CompositeToken {
//     type: ATTRIBUTE;
//     children: Token[];
//     id: PID;
//     name: string;
// }

// export type AttributeRecognizer = PatternRecognizer<Item>;

// export function CreateAttributeRecognizer(
//     attributeFile: string,
//     downstreamWords: Set<string>,
//     stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
//     debugMode = false
// ): AttributeRecognizer {
//     const items = itemMapFromYamlString(fs.readFileSync(attributeFile, 'utf8'));

//     const tokenFactory = (id: PID, children: Token[]): AttributeToken => {
//         const item = items.get(id);

//         let name = "UNKNOWN";
//         if (item) {
//             name = item.name;
//         }
//         return { type: ATTRIBUTE, id, name, children };
//     };

//     return new PatternRecognizer(items, tokenFactory, downstreamWords, stemmer, false, true, debugMode);
// }

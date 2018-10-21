import * as fs from 'fs';
import { indexFromYamlString, Item, PatternRecognizer } from '../../src/tokenizer';
import { PID, StemmerFunction, Token, Tokenizer } from '../../src/tokenizer';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    text: string;
    id: PID;
    name: string;
}

export type AttributeRecognizer = PatternRecognizer<Item>;

export function CreateAttributeRecognizer(
    attributeFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): AttributeRecognizer {
    const index = indexFromYamlString(fs.readFileSync(attributeFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): AttributeToken => {
        const name = index.items[id].name;
        return { type: ATTRIBUTE, id, name, text };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}

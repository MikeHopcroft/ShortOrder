import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer } from '../../src/tokenizer';
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
    const items = itemMapFromYamlString(fs.readFileSync(attributeFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): AttributeToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ATTRIBUTE, id, name, text };
    };

    return new PatternRecognizer(items, tokenFactory, badWords, stemmer, debugMode);
}

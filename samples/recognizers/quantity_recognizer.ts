import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer } from 'token-flow';
import { PID, StemmerFunction, Tokenizer, Token } from 'token-flow';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends Token {
    type: QUANTITY;
    text: string;
    value: number;
}

export type QuantityRecognizer = PatternRecognizer<Item>;

export function CreateQuantityRecognizer(
    quantityFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): QuantityRecognizer {
    const items = itemMapFromYamlString(fs.readFileSync(quantityFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): QuantityToken => {
        const item = items.get(id);

        let value = "UNKNOWN";
        if (item) {
            value = item.name;
        }
        return { type: QUANTITY, text, value: Number(value) };
    };

    return new PatternRecognizer(items, tokenFactory, badWords, stemmer, debugMode);
}

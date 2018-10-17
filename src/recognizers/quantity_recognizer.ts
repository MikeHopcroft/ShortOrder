import { indexYamlFilename, Item, PatternRecognizer } from '../tokenizer';
import { PID, StemmerFunction, Token, Tokenizer } from '../tokenizer';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends Token {
    type: QUANTITY;
    text: string;
    value: number;
}

export type QuantityRecognizer = PatternRecognizer<Item>;

export function CreateQuantityRecognizer(
    intentFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): QuantityRecognizer {
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): QuantityToken => {
        const value = index.items[id].name;
        return { type: QUANTITY, text, value: Number(value) };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}

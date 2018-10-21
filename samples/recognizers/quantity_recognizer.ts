import * as fs from 'fs';
import { QUANTITY, QuantityToken } from '../../src/recognizers';
import { indexFromYamlString, Item, PatternRecognizer } from '../../src/tokenizer';
import { PID, StemmerFunction, Token, Tokenizer } from '../../src/tokenizer';

export type QuantityRecognizer = PatternRecognizer<Item>;

export function CreateQuantityRecognizer(
    quantityFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): QuantityRecognizer {
    const index = indexFromYamlString(fs.readFileSync(quantityFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): QuantityToken => {
        const value = index.items[id].name;
        return { type: QUANTITY, text, value: Number(value) };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}

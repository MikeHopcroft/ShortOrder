import { indexYamlFilename, PatternRecognizer } from './pattern_recognizer';
import { PID, Token, Tokenizer, UnknownToken, UNKNOWN } from '../tokenizer';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends Token {
    type: QUANTITY;
    text: string;
    value: number;
}

export function CreateQuantityRecognizer(intentFile: string, debugMode = false): PatternRecognizer {
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): QuantityToken => {
        const value = index.items[id].name;
        return { type: QUANTITY, text, value: Number(value) };
    };

    const badWords: string[] = [];
    return new PatternRecognizer(index, tokenFactory, badWords, debugMode);
}

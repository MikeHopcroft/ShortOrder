import * as fs from 'fs';
import { indexFromYamlString, Item, PatternRecognizer } from '../../src/tokenizer';
import { PID, StemmerFunction, Token, Tokenizer } from '../../src/tokenizer';

export const INTENT: unique symbol = Symbol('INTENT');
export type INTENT = typeof INTENT;

export interface IntentToken extends Token {
    type: INTENT;
    text: string;
    id: PID;
    name: string;
}

export type IntentRecognizer = PatternRecognizer<Item>;

export function CreateIntentRecognizer(
    intentFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): IntentRecognizer {
    const index = indexFromYamlString(fs.readFileSync(intentFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): IntentToken => {
        const name = index.items[id].name;
        return { type: INTENT, id, name, text };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}

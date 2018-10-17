import { indexYamlFilename, Item, PatternRecognizer } from '../tokenizer';
import { PID, StemmerFunction, Token, Tokenizer } from '../tokenizer';

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
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): IntentToken => {
        const name = index.items[id].name;
        return { type: INTENT, id, name, text };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}

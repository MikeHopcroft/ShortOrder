import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer } from 'token-flow';
import { PID, StemmerFunction, Token, Tokenizer } from 'token-flow';

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
    const items = itemMapFromYamlString(fs.readFileSync(intentFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): IntentToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: INTENT, id, name, text };
    };

    return new PatternRecognizer(items, tokenFactory, badWords, stemmer, debugMode);
}

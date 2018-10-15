import { indexYamlFilename, PatternRecognizer } from './pattern_recognizer';
import { PID, Token } from '../tokenizer';
import { debug } from 'util';

export const INTENT: unique symbol = Symbol('INTENT');
export type INTENT = typeof INTENT;

export interface IntentToken extends Token {
    type: INTENT;
    text: string;
    id: PID;
    name: string;
}

export function CreateIntentRecognizer(intentFile: string, debugMode = false): PatternRecognizer {
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): IntentToken => {
        const name = index.items[id].name;
        return { type: INTENT, id, name, text };
    };

    const badWords: string[] = [];
    return new PatternRecognizer(index, tokenFactory, badWords, debugMode);
}

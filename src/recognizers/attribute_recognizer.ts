import { indexYamlFilename, PatternRecognizer } from './pattern_recognizer';
import { PID, Token } from '../tokenizer';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    text: string;
    id: PID;
    name: string;
}

export function CreateAttributeRecognizer(intentFile: string, debugMode = false): PatternRecognizer {
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): AttributeToken => {
        const name = index.items[id].name;
        return { type: ATTRIBUTE, id, name, text };
    };

    const badWords: string[] = [];
    return new PatternRecognizer(index, tokenFactory, badWords, debugMode);
}

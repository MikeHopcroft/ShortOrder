import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer, PID, StemmerFunction, Token, Tokenizer } from '../../src/tokenizer';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    text: string;
    pid: PID;
    name: string;
}

export type EntityRecognizer = PatternRecognizer<Item>;

export function CreateEntityRecognizer(
    entityFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false) {
    const items = itemMapFromYamlString(fs.readFileSync(entityFile, 'utf8'));

    const tokenFactory = (id: PID, text: string): EntityToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ENTITY, pid: id, name, text };
    };

    return new PatternRecognizer(items, tokenFactory, badWords, stemmer, debugMode);
}

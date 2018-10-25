import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Item, PatternRecognizer, PID, StemmerFunction, Token, Tokenizer } from 'token-flow';

import { Catalog, CatalogItems, ItemDescription } from '../catalog';

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
    debugMode = false
) {
    const catalogItems = yaml.safeLoad(fs.readFileSync(entityFile, 'utf8')) as CatalogItems;
    const catalog = new Catalog(catalogItems);

    const tokenFactory = (id: PID, text: string): EntityToken => {
        const item = catalog.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ENTITY, pid: id, name, text };
    };

    return new PatternRecognizer(catalog.map, tokenFactory, badWords, stemmer, debugMode);
}

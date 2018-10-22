import * as yaml from 'js-yaml';
import { generateAliases, PID, Recognizer, StemmerFunction, Token, TokenFactory, Tokenizer } from '.';
import { copyArray, copyScalar } from '../utilities';

export interface Item {
    pid: PID;
    name: string;
    aliases: string[];
}

// tslint:disable-next-line:no-any
function itemFromYamlItem(item: any): Item {
    return {
        pid: copyScalar<number>(item, 'pid', 'number'),
        name: copyScalar<string>(item, 'name', 'string'),
        aliases: copyArray<string>(item, 'aliases', 'string'),
    };
}

export function itemMapFromYamlString(yamlText: string): Map<PID, Item> {
    // tslint:disable-next-line:no-any
    const yamlRoot: any = yaml.safeLoad(yamlText);

    if (typeof (yamlRoot) !== 'object') {
        throw TypeError('itemsFromYamlString: expected a top-level object with items array.');
    }

    const yamlItems = yamlRoot['items'] as Item[];
    if (yamlItems === undefined || !Array.isArray(yamlRoot.items)) {
        throw TypeError('itemsFromYamlString: expected items array.');
    }

    const map = new Map<PID, Item>();
    for (const item of yamlItems) {
        if (map.has(item.pid)) {
            throw TypeError(`itemsFromYamlString: found duplicate pid in item ${item}`);
        }
        else {
            map.set(item.pid, item);
        }
    }

    return map;
}

export class PatternRecognizer<T extends Item> implements Recognizer {
    items: Map<PID, T>;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory<Token>;
    stemmer: (word: string) => string;

    constructor(
        items: Map<PID, T>,
        tokenFactory: TokenFactory<Token>,
        badWords: Set<string>,
        stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
        debugMode = false
    ) {
        this.items = items;
        this.tokenizer = new Tokenizer(badWords, stemmer, debugMode);
        this.stemmer = this.tokenizer.stemTerm;
        this.tokenFactory = tokenFactory;

        // Ingest index.
        let aliasCount = 0;
        for (const [pid, item] of this.items) {
            for (const aliasPattern of item.aliases) {
                for (const alias of generateAliases(aliasPattern)) {
                    this.tokenizer.addItem(item.pid, alias);
                    aliasCount++;
                }
            }
        }

        // TODO: print name of tokenizer here?
        console.log(`${this.items.size} items contributed ${aliasCount} aliases.`);
    }

    apply = (token: Token) => {
        const path = this.tokenizer.processQuery(token.text);
        const terms = token.text.split(' ');

        return this.tokenizer.tokenizeMatches(terms, path, this.tokenFactory);
    }

    terms = () => {
        const terms = new Set<string>();
        for (const [pid, item] of this.items) {
            for (const alias of item.aliases) {
                const words = alias.split(' ');
                for (const word of words) {
                    terms.add(word);
                }
            }
        }
        return terms;
    }
}
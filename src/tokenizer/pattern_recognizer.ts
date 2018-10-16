import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { generateAliases, PID, Recognizer, Token, TokenFactory, Tokenizer } from '.';
import { copyArray, copyScalar } from '../utilities';

export interface Item {
    pid: PID;
    name: string;
    aliases: string[];
}

export class Index<T extends Item> {
    items: { [pid: number]: Item } = {};

    addItem = (item: T) => {
        if (this.items[item.pid] === undefined) {
            this.items[item.pid] = item;
        }
        else {
            throw TypeError(`Index.addItem: found duplicate pid in item ${item}`);
        }
    }
}

// tslint:disable-next-line:no-any
function ItemFromYamlItem(item: any): Item {
    return {
        pid: copyScalar<number>(item, 'pid', 'number'),
        name: copyScalar<string>(item, 'name', 'string'),
        aliases: copyArray<string>(item, 'aliases', 'string'),
    };
}

export function indexYamlFilename(filename: string): Index<Item> {
    // tslint:disable-next-line:no-any
    const yamlRoot: any = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

    if (typeof (yamlRoot) !== 'object') {
        throw TypeError('Inent: expected a top-level object with items array.');
    }

    const yamlItems = yamlRoot['items'] as Item[];
    if (yamlItems === undefined || !Array.isArray(yamlRoot.items)) {
        throw TypeError('Intent: expected items array.');
    }

    const index = new Index();
    yamlItems.forEach(item => {
        index.addItem(ItemFromYamlItem(item));
    });

    return index;
}

export class PatternRecognizer<T extends Item> implements Recognizer {
    index: Index<T>;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory<Token>;
    stemmer: (word:string) => string;

    constructor(index: Index<T>, tokenFactory: TokenFactory<Token>, badWords: Set<string>, debugMode = false) {
        this.index = index;
        this.tokenizer = new Tokenizer(badWords, debugMode);
        this.stemmer = this.tokenizer.stemTerm;
        this.tokenFactory = tokenFactory;

        // Ingest index.
        let aliasCount = 0;
        Object.entries(this.index.items).forEach(([pid, item]) => {
            item.aliases.forEach(aliasPattern => {
                // console.log(aliasPattern);
                for (const alias of generateAliases(aliasPattern)) {
                    // console.log(`  ${alias}`);
                    this.tokenizer.addItem(item.pid, alias);
                    aliasCount++;
                }              
            });
        });

        // TODO: print name of tokenizer here?
        console.log(`${Object.keys(this.index.items).length} items contributed ${aliasCount} aliases.`);
        console.log();
    }

    apply = (token: Token) => {
        const path = this.tokenizer.processQuery(token.text);
        const terms = token.text.split(' ');

        return this.tokenizer.tokenizeMatches(terms, path, this.tokenFactory);
    }

    terms = () => {
        const terms = new Set<string>();
        Object.entries(this.index.items).forEach(([pid, item]) => {
            item.aliases.forEach(alias => {
                const words = alias.split(' ');
                words.forEach( word => {
                    terms.add(word);
                });
            });
        });
        return terms;
    }
}
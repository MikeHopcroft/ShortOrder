import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { PID, Token, TokenFactory, Tokenizer } from '../tokenizer';
import { copyArray, copyScalar } from '../utilities';

export interface Item {
    pid: PID;
    name: string;
    aliases: string[];
}

export class Index {
    items: { [pid: number]: Item } = {};

    addItem(item: Item) {
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

export function indexYamlFilename(filename: string): Index {
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

export class PatternRecognizer {
    index: Index;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory<Token>;

    constructor(index: Index, tokenFactory: TokenFactory<Token>, badWords: string[], debugMode = false) {
        this.index = index;
        this.tokenizer = new Tokenizer(badWords, debugMode);
        Object.entries(this.index.items).forEach(([pid, item]) => {
            item.aliases.forEach(alias => {
                this.tokenizer.addItem(item.pid, alias);
            });
        });

        this.tokenFactory = tokenFactory;
    }

    apply = (token: Token) => {
        const path = this.tokenizer.processQuery(token.text);
        const terms = token.text.split(' ');

        return this.tokenizer.tokenizeMatches(terms, path, this.tokenFactory);
    }
}
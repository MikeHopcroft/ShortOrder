import { Menu } from '../menu';
import { PID, Token, Tokenizer } from '../tokenizer';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    text: string;
    pid: PID;
    name: string;
}

export class EntityRecognizer {
    index: Menu;
    tokenizer: Tokenizer;

    constructor(entityFile: string) {
        this.index = Menu.fromYamlFilename(entityFile);

        // TODO: Pass these in as a parameter.
        const badWords = [
            'small', 'medium', 'large',
            'chocolate', 'strawberry', 'vanilla',
            'and'
        ];
        const debugMode = false;
        this.tokenizer = new Tokenizer(badWords, debugMode);

        // Ingest menu.
        let aliasCount = 0;
        Object.entries(this.index.items).forEach(([pid, item]) => {
            item.aliases.forEach((alias) => {
                this.tokenizer.addItem(item.pid, alias);
                aliasCount++;
            });
        });
        console.log(`${this.index.length()} items contributed ${aliasCount} aliases.`);
        console.log();
    }

    apply = (token: Token) => {
        const path = this.tokenizer.processQuery(token.text);
        const terms = token.text.split(' ');
    
        const tokenFactory = (pid:PID, text:string):EntityToken => {
            const name = this.index.items[pid].name;
            return {type: ENTITY, pid, name, text};
        };
    
        return this.tokenizer.tokenizeMatches(terms, path, tokenFactory);
    }
}
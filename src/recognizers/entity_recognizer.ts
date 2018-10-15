import { Menu, MenuItem } from '../menu';
import { PatternRecognizer, PID, Token } from '../tokenizer';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    text: string;
    pid: PID;
    name: string;
}

export type EntityRecognizer = PatternRecognizer<MenuItem>;

export function CreateEntityRecognizer(entityFile: string, debugMode = false) {
    const index = Menu.fromYamlFilename(entityFile);

    const tokenFactory = (pid:PID, text:string):EntityToken => {
        const name = index.items[pid].name;
        return {type: ENTITY, pid, name, text};
    };

    // TODO: Pass these in as a parameter.
    const badWords = [
        'small', 'medium', 'large',
        'chocolate', 'strawberry', 'vanilla',
        'and'
    ];

    return new PatternRecognizer(index, tokenFactory, badWords, debugMode);
}

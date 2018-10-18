import * as path from 'path';
import { CreateEntityRecognizer, ENTITY, EntityRecognizer, EntityToken } from '../recognizers';
import { UNKNOWN, UnknownToken } from '../tokenizer';

function run(recognizer: EntityRecognizer, query:string) {
    const input = { type:UNKNOWN, text: query };
    const tokens = recognizer.apply(input);

    const observed = tokens.map( t => {
        const token = t as (EntityToken | UnknownToken);
        if (token.type === ENTITY) {
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            return `[${entity}(${token.pid})]`;
        }
        else {
            return token.text;
        }
    }).join(' ');

    console.log(`Returned: "${observed}"`);
    console.log();
}


export function ingestAndTest(menuFile: string, query: string) {
    const badWords = new Set();
    const recognizer = CreateEntityRecognizer(menuFile, badWords);

    run(recognizer, query);
}

ingestAndTest(
    path.join(__dirname, './data/menu.yaml'),
    'can I have two hamburgers'
    // "Uh yeah I'd like a pet chicken fries and a coke"
    // 'Dakota burger with extra swiss cheese'
);


import * as path from 'path';
import { Pipeline, printToken, tokenToString } from './pipeline';
import * as readlineSync from 'readline-sync';
import {speechToTextFilter} from './speech_to_text_filter';

export function repl(
    menuFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string
) {
    console.log('Welcome to the ShortOrder REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();

    const pipeline = new Pipeline(menuFile, intentFile, attributesFile, quantifierFile);

    while (true) {
        const line = readlineSync.question('% ');
        if (line.length === 0) {
            console.log('bye');
            break;
        }

        console.log();

        const text = speechToTextFilter(line);
        if (text !== line) {
            console.log('********************************************************');
            console.log('PLEASE NOTE: your input has been modified to be more');
            console.log('like the output of a speech-to-text system.');
            console.log(`your input: "${line}"`);
            console.log(`modified:   "${text}"`);
            console.log('********************************************************');
        }

        const tokens = pipeline.processOneQuery(text);
        tokens.forEach(printToken);

        console.log();
    }
}

export function replDemo() {
    repl(
        path.join(__dirname, './data/menu.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'));
}

// replDemo();


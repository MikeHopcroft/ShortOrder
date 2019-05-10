import * as style from 'ansi-styles';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as replServer from 'repl';

import { PID } from 'prix-fixe';
import { Token } from 'token-flow';

import { actionToString, AnyAction } from '../actions';
import { attributesFromYamlString, AttributeInfo } from '../attributes';
import { CartOps, State } from '../cart';
import { Catalog, CatalogItems, ConvertDollarsToPennies, validateCatalogItems, ItemDescription } from '../catalog';
import { Parser } from '../parser';
import { speechToTextFilter } from './speech_to_text_filter';
import { responses } from '../turn';
import { ENTITY, EntityToken, Unified, AnyToken } from '../unified';

import { tokenToColoredString } from './colored_tokens';

const maxHistorySteps = 1000;
const historyFile = '.repl_history';

export function runRepl(
    catlogFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string,
    unitsFile: string,
    stopwordsFile: string
) {
    let debugMode = false;

    console.log('Welcome to the ShortOrder REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();
    console.log('Type .help for information on commands.');
    console.log();

    // Set up the tokenizer pipeline.
    const unified = new Unified(
        catlogFile,
        intentFile,
        attributesFile,
        quantifierFile,
        unitsFile,
        stopwordsFile,
    );
    console.log();

    // Set up the conversational agent and parser.
    // TODO: can we avoid reading the catalog twice?
    const catalogItems = yaml.safeLoad(fs.readFileSync(catlogFile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);

    const attributes = attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    const attributeInfo = AttributeInfo.factory(catalog, attributes);

    const parser = new Parser(catalog, attributeInfo, unified, debugMode);   
    const ops = new CartOps(catalog, true);

    let state: State = { cart: { items: [] }, actions: [] };

    const repl = replServer.start({
        prompt: '% ',
        input: process.stdin,
        output: process.stdout,
        eval: myEval,
        writer: myWriter
    });

    if (fs.existsSync(historyFile)) {
        fs.readFileSync(historyFile)
            .toString()
            .split('\n')
            .reverse()
            .filter((line: string) => line.trim())
            // tslint:disable-next-line:no-any
            .map((line: string) => (repl as any).history.push(line));
    }

    repl.on('exit', () => {
        // tslint:disable-next-line:no-any
        const historyItems = ((repl as any).history as string[]).reverse();
        const history = 
            historyItems.slice(Math.max(historyItems.length - maxHistorySteps, 1)).join('\n');
        fs.writeFileSync(historyFile, history);
        console.log('bye');
        process.exit();
    });

    repl.defineCommand('debug', {
        help: 'Toggle debug mode.',
        action(text: string) {
            debugMode = !debugMode;
            console.log(`Debug mode ${debugMode ? "on" : "off"}.`);
            repl.displayPrompt();
        }
    });

    repl.defineCommand('tokenize', {
        help: "Tokenize, but don't parse, text that follows.",
        action(line: string) {

            const text = speechToTextFilter(line);
            if (text !== line) {
                console.log(`${style.red.open}`);
                console.log('********************************************************');
                console.log('PLEASE NOTE: your input has been modified to be more');
                console.log('like the output of a speech-to-text system.');
                console.log(`your input: "${line}"`);
                console.log(`modified:   "${text}"`);
                console.log('********************************************************');
                console.log(`${style.red.close}`);
            }
    
            const tokens = unified.processOneQuery(text);

            console.log(`${style.black.open}`);

            // console.log(tokens.map(tokenToString).join('\n'));

            const formatter = (token: Token) => tokenToColoredString(token as AnyToken, catalog, attributeInfo);
            console.log(tokens.map(formatter).join('\n'));

            console.log(`${style.black.close}`);
    
            repl.displayPrompt();
        }
    });

    repl.defineCommand('menu', {
        help: "Display menu",
        action(line: string) {
            if (line.length === 0) {
                for (const [pid, item] of catalog.map) {
                    if (item.standalone) {
                        console.log(`${pid} ${item.name}`);
                    }
                }
            }
            else if (!isNaN(Number(line))) {
                const pid: PID = Number(line);

                if (!catalog.has(pid)) {
                    console.log(`${style.red.open}Unknown PID ${pid}${style.red.close}`);
                }
                else {
                    const item = catalog.get(Number(line));
                    printMenuItem(item, catalog);
                }
            }
            else {
                const tokens = unified.processOneQuery(line);
                if (tokens.length > 0 && tokens[0].type === ENTITY) {
                    const token = tokens[0] as EntityToken;
                    const pid = token.pid;
                    if (catalog.has(pid)) {
                        const item = catalog.get(pid);
                        printMenuItem(item, catalog);
                    }
                    else {
                        // This should never happen if tokenizer returned PID.
                        console.log(`Unrecognized menu item "${line}"`);
                    }
                }
                else {
                    console.log(`Unrecognized menu item "${line}"`);
                }
            }
            repl.displayPrompt();
        }
    });


    // tslint:disable-next-line:no-any
    function myEval(line: string, context: any, filename: any, callback: any) {
        console.log();

        if (line === '\n') {
            repl.close();
        }
        else {
            const lines = line.split(/[\n\r]/);
            if (lines[lines.length - 1].length === 0) {
                // Remove last empty line so that we can distinguish whether
                // we're in interactive mode or doing a .load.
                lines.pop();
            }
            for (line of lines) {
                if (line.length > 0) {
                    // Only process lines that have content.
                    // In an interactive session, an empty line will exit.
                    // When using .load, empty lines are ignored.

                    if (lines.length > 1) {
                        // When we're processing multiple lines, for instance
                        // via the .load command, print out each line before
                        // processing.
                        console.log(`CUSTOMER: "${line}"`);
                        console.log();
                    }

                    const text = speechToTextFilter(line);
                    if (text !== line) {
                        console.log(`${style.red.open}`);
                        console.log('********************************************************');
                        console.log('PLEASE NOTE: your input has been modified to be more');
                        console.log('like the output of a speech-to-text system.');
                        console.log(`your input: "${line}"`);
                        console.log(`modified:   "${text}"`);
                        console.log('********************************************************');
                        console.log(`${style.red.close}`);
                    }

                    state = parser.parseText(text, state);
                    console.log(`${style.yellow.open}${ops.cartToString(state.cart)}${style.yellow.open}`);
                    console.log();

                    state = ops.missingChoicesInCart(state);

                    if (debugMode) {
                        for (const action of state.actions) {
                            console.log(`ACTION: ${actionToString(action as AnyAction)}`);
                        }
                    }

                    const order = ops.formatCart(state.cart);
                    const replies = 
                        responses(state.actions as AnyAction[], order, catalog);

                    state = {...state, actions: []};

                    const output = `${style.green.open}${replies.join(' ')}${style.green.close}`;    
                    console.log(output);
                    console.log();
                }
            }

            callback(null, '');    
        }
    }

    function myWriter(text: string) {
        return text;
    }
}

function printMenuItem(item: ItemDescription, catalog: Catalog) {
    console.log(`${item.pid} ${item.name}`);
    if (item.composition.defaults.length > 0) {
        const defaults = item.composition.defaults.map( (x) => catalog.get(x.pid).name );
        console.log(`  Ingredients: ${defaults.join(', ')}`);
    }
    if (item.composition.options.length > 0) {
        const options = item.composition.options.map( (x) => catalog.get(x.pid).name );
        console.log(`  Options: ${options.join(', ')}`);
    }
    for (const choice of item.composition.choices) {
        const alternatives = choice.alternatives.map( (x) => catalog.get(x).name );
        console.log(`  Choice of ${choice.className}: ${alternatives.join(', ')}`);
    }
    console.log();
}
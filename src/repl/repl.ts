import * as style from 'ansi-styles';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as replServer from 'repl';

import { actionToString, AnyAction } from '../actions';
import { CartOps, State } from '../cart';
import { Catalog, CatalogItems, ConvertDollarsToPennies, validateCatalogItems } from '../catalog';
import { Parser } from '../parser';
import { Pipeline, printTokens } from '../pipeline';
import { speechToTextFilter } from './speech_to_text_filter';
import { responses } from '../turn';

const maxHistorySteps = 1000;
const historyFile = '.repl_history';

export function runRepl(
    catlogFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string
) {
    let debugMode = false;

    console.log('yyxxWelcome to the ShortOrder REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();

    // Set up the tokenizer pipeline.
    const pipeline = new Pipeline(catlogFile, intentFile, attributesFile, quantifierFile);
    console.log();

    // Set up the conversational agent and parser.
    // TODO: can we avoid reading the catalog twice?
    const catalogItems = yaml.safeLoad(fs.readFileSync(catlogFile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);

    const parser = new Parser(catalog, pipeline, debugMode);   
    const ops = new CartOps(catalog);

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
    
            const tokens = pipeline.processOneQuery(text, debugMode);

            console.log(`${style.yellow.open}`);
            printTokens(tokens);
            console.log(`${style.yellow.close}`);
    
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
            
                    state = parser.parse(text, state);
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

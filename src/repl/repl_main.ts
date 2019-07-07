import * as style from 'ansi-styles';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as replServer from 'repl';

// TODO
// Replace .menu with .products and .options
// Implement tokenize


import {
    Cart,
    GenericTypedEntity, 
    ICatalog,
    ItemInstance,
    Key,
    PID,
    State
} from 'prix-fixe';

import { createShortOrderProcessor, createWorld } from '../fuzzer';
import { speechToTextFilter } from './speech_to_text_filter';


const maxHistorySteps = 1000;
const historyFile = '.repl_history';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Read-Eval-Print-Loop (REPL)');
    console.log('');
    console.log('An interactive utterance processor.');
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-h|help|?]`);
    console.log('');
    console.log('-d datapath     Path to prix-fixe data files.');
    console.log('                    attributes.yaml');
    console.log('                    intents.yaml');
    console.log('                    options.yaml');
    console.log('                    products.yaml');
    console.log('                    quantifiers.yaml');
    console.log('                    rules.yaml');
    console.log('                    stopwords.yaml');
    console.log('                    units.yaml');
    console.log('                The -d flag overrides the value specified');
    console.log('                in the PRIX_FIXE_DATA environment variable.');
    console.log('-h|help|?       Show this message.');
    console.log(' ');
}

export function replMain() {
    dotenv.config();
    const args = minimist(process.argv.slice());

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }

    if (args.h || args.help || args['?']) {
        showUsage();
        return;
    }

    if (dataPath === undefined) {
        console.log('Use -d flag or PRIX_FIXE_DATA environment variable to specify data path');
        return;
    }

    runRepl(dataPath);
}

export function runRepl(
    dataPath: string
) {
    let debugMode = false;

    console.log('Welcome to the ShortOrder REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();
    console.log('Type .help for information on commands.');
    console.log();

    // Set up the tokenizer pipeline.
    const world = createWorld(dataPath);
    const catalog = world.catalog;
    const processor = createShortOrderProcessor(world, dataPath, false);

    let state: State = { cart: { items: [] } };

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
    
            // const tokens = unified.processOneQuery(text);

            // console.log(`${style.black.open}`);

            // console.log(tokens.map(tokenToString).join('\n'));

            // console.log(tokens.map(tokenToString).join('\n'));

            // console.log(`${style.black.close}`);

            console.log('Tokenize not implemented.');
    
            repl.displayPrompt();
        }
    });

    repl.defineCommand('menu', {
        help: "Display menu",
        action(line: string) {
            if (line.length === 0) {
                for (const item of catalog.genericEntities()) {
                    console.log(`${item.pid} ${item.name}`);
                }
            }
            else if (!isNaN(Number(line))) {
                const pid: PID = Number(line);

                if (!catalog.hasPID(pid)) {
                    console.log(`${style.red.open}Unknown PID ${pid}${style.red.close}`);
                }
                else {
                    const item = catalog.getGeneric(Number(line));
                    printMenuItem(item, catalog);
                }
            }
            // else {
            //     const tokens = unified.processOneQuery(line);
            //     if (tokens.length > 0 && tokens[0].type === ENTITY) {
            //         const token = tokens[0] as EntityToken;
            //         const pid = token.pid;
            //         if (catalog.has(pid)) {
            //             const item = catalog.get(pid);
            //             printMenuItem(item, catalog);
            //         }
            //         else {
            //             // This should never happen if tokenizer returned PID.
            //             console.log(`Unrecognized menu item "${line}"`);
            //         }
            //     }
            //     else {
            //         console.log(`Unrecognized menu item "${line}"`);
            //     }
            // }
            repl.displayPrompt();
        }
    });


    // tslint:disable-next-line:no-any
    async function myEval(line: string, context: any, filename: any, callback: any) {
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

                    state = await processor(text, state);
                    const order: TestOrder = formatCart(state.cart, catalog);
                    const orderText = OrderOps.formatOrder(order);
                    // state = parser.parseText(text, state);
                    console.log(`${style.yellow.open}${orderText}${style.yellow.open}`);
                    console.log();

                    // state = ops.missingChoicesInCart(state);

                    // if (debugMode) {
                    //     for (const action of state.actions) {
                    //         console.log(`ACTION: ${actionToString(action as AnyAction)}`);
                    //     }
                    // }

                    // const order = ops.formatCart(state.cart);
                    // const replies = 
                    //     responses(state.actions as AnyAction[], order, catalog);

                    // state = {...state, actions: []};

                    // const output = `${style.green.open}${replies.join(' ')}${style.green.close}`;
                    // console.log(output);
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

function printMenuItem(item: GenericTypedEntity, catalog: ICatalog) {
    console.log(`${item.pid} ${item.name}`);
    // if (item.composition.defaults.length > 0) {
    //     const defaults = item.composition.defaults.map( (x) => catalog.get(x.pid).name );
    //     console.log(`  Ingredients: ${defaults.join(', ')}`);
    // }
    // if (item.composition.options.length > 0) {
    //     const options = item.composition.options.map( (x) => catalog.get(x.pid).name );
    //     console.log(`  Options: ${options.join(', ')}`);
    // }
    // for (const choice of item.composition.choices) {
    //     const alternatives = choice.alternatives.map( (x) => catalog.get(x).name );
    //     console.log(`  Choice of ${choice.className}: ${alternatives.join(', ')}`);
    // }
    // console.log();
}

interface TestLineItem {
    readonly indent: number;
    readonly quantity: number;
    readonly key: Key;
    readonly name: string;
}

// A simplified view of the Cart, suitable for test verification.
interface TestOrder {
    readonly lines: TestLineItem[];
}

function formatCart(cart: Cart, catalog: ICatalog): TestOrder {
    const lines: TestLineItem[] = [];

    for (const item of cart.items) {
        formatItem(catalog, lines, item, 0);
    }

    return { lines };
}

function formatItem(
    catalog: ICatalog,
    order: TestLineItem[],
    item: ItemInstance,
    indent: number
): void {
    let name: string;
    if (catalog.hasKey(item.key)) {
        name = catalog.getSpecific(item.key).name;
    } else {
        name = `UNKNOWN(${item.key})`;
    }
    const quantity = item.quantity;
    const key = item.key;

    order.push({ indent, quantity, key, name });

    for (const child of item.children) {
        formatItem(catalog, order, child, indent + 1);
    }
}


class OrderOps {
    // TODO: does this convenience method really belong here?
    static printOrder(order: TestOrder) {
        console.log(OrderOps.formatOrder(order));
    }

    static formatOrder(order: TestOrder) {
        return order.lines.map(OrderOps.formatLineItem).join('\n');
    }

    static formatLineItem(item: TestLineItem) {
        const leftFieldWidth = 4 + item.indent * 2;
        const left = rightJustify(item.quantity + ' ', leftFieldWidth);

        const rightFieldWidth = 10;
        let right = '';
        right = rightJustify(item.key, rightFieldWidth);

        const totalWidth = 50;
        const middleWidth = 
            Math.max(0, totalWidth - left.length - right.length);
        const middle = leftJustify(item.name + ' ', middleWidth);

        return `${left}${middle}${right}`;
    }
}

function leftJustify(text: string, width: number) {
    if (text.length >= width) {
        return text;
    }
    else {
        const paddingWidth = width - text.length;
        const padding = new Array(paddingWidth + 1).join(' ');
        return text + padding;
    }
}

function rightJustify(text: string, width: number) {
    if (text.length >= width) {
        return text;
    }
    else {
        const paddingWidth = width - text.length;
        const padding = new Array(paddingWidth + 1).join(' ');
        return padding + text;
    }
}

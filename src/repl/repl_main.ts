import * as style from 'ansi-styles';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as minimist from 'minimist';
import * as path from 'path';
import * as replServer from 'repl';

import {
    aliasesFromPattern,
    Cart,
    ICatalog,
    ItemInstance,
    Key,
    MENUITEM,
    OPTION,
    patternFromExpression,
    PID,
    Processor,
    State,
    TestCase,
    TestSuite,
    YamlTestCase
} from 'prix-fixe';

import { createShortOrderWorld, createWorld } from '../integration';
import { ENTITY, EntityToken, tokenToString, OptionToken } from '../lexer';

import { speechToTextFilter } from './speech_to_text_filter';

class Session {
    utterances: string[] = [];
    yamlTestCases: YamlTestCase[] = [];
    state: State = { cart: { items: [] } };

    copy(): Session {
        const session = new Session();
        session.utterances = [...this.utterances];
        session.yamlTestCases = [...this.yamlTestCases];
        session.state = this.state;
        return session;
    }

    reset(): void {
        this.utterances = [];
        this.yamlTestCases = [];
        this.state = { cart: { items: [] } };
    }
}

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

    const world2 = createShortOrderWorld(world, dataPath, false);
    const lexer = world2.lexer;
    const processor = world2.processor;

    const stack: Session[] = [new Session()];
    let recordMode = false;

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

    repl.defineCommand('reset', {
        help: 'Clear shopping cart.',
        action(text: string) {
            stack[stack.length - 1].reset();
            console.log('Cart has been reset.');
            repl.displayPrompt();
        }
    });


    repl.defineCommand('push', {
        help: 'Push shopping cart on the stack.',
        action(text: string) {
            stack.push(stack[stack.length - 1].copy());
            console.log('Cart has been pushed onto the stack.');
            repl.displayPrompt();
        }
    });

    repl.defineCommand('pop', {
        help: 'Pop shopping cart from the stack.',
        action(text: string) {
            console.log(`stack.length = ${stack.length}`);
            if (stack.length > 1) {
                stack.pop();
                const session = stack[stack.length -1];
                const order: TestOrder = formatCart(session.state.cart, catalog);
                const orderText = OrderOps.formatOrder(order);
                console.log(`${style.yellow.open}${orderText}${style.yellow.open}`);
                console.log();
            } else {
                console.log('Cannot pop - stack is already empty');
            }
            repl.displayPrompt();
        }
    });

    repl.defineCommand('restore', {
        help: 'Restore cart to top of stack without popping.',
        action(text: string) {
            if (stack.length > 1) {
                stack.pop();
                stack.push(stack[stack.length - 1].copy());
                const session = stack[stack.length -1];
                const order: TestOrder = formatCart(session.state.cart, catalog);
                const orderText = OrderOps.formatOrder(order);
                console.log(`${style.yellow.open}${orderText}${style.yellow.open}`);
                console.log();
            } else {
                console.log('Cannot restore - stack is already empty');
            }
            repl.displayPrompt();
        }
    });

    repl.defineCommand('random', {
        help: 'Add a random item to the cart.',
        action(text: string) {
            console.log('Random item not implemented.');
            repl.displayPrompt();
        }
    });

    repl.defineCommand('record', {
        help: 'Toggle YAML recording mode.',
        action(text: string) {
            recordMode = !recordMode;
            console.log(`YAML record mode ${recordMode ? "on" : "off"}.`);
            stack[stack.length - 1].reset();
            console.log('Cart has been reset.');
            repl.displayPrompt();
        }
    });

    repl.defineCommand('yaml', {
        help: 'Display YAML test case for cart',
        action(text: string) {
            const yamlTestCases = stack[stack.length - 1].yamlTestCases;

            if (!recordMode) {
                console.log('You must first enable YAML recording with the .record command.');
            } else if (yamlTestCases.length > 0) {
                const yamlText = yaml.safeDump(yamlTestCases, { noRefs: true });
                console.log(' ');
                console.log('WARNING: test case expects short-order behavior.');
                console.log('Be sure to manually verify.');
                console.log(' ');
                console.log(yamlText);
            }
            repl.displayPrompt();
        }
    });

    repl.defineCommand('match', {
        help: 'List fuzzy matches in order of decreasing score.',
        action(text: string) {
            const graph = lexer.createGraph(text);
            const tokenization = lexer.tokenizationsFromGraph2(graph).next().value;

            interface Match {
                token: EntityToken | OptionToken;
                score: number;
            }

            const tokens = new Array<[EntityToken | OptionToken, number]>();
            for (const edge of tokenization.graph.edgeLists[0]) {
                const token = lexer.tokenizer.tokenFromEdge(edge) as EntityToken | OptionToken;
                if (token.type === ENTITY || token.type === OPTION) {
                    tokens.push([token, edge.score]);
                }
            }

            const sorted = [...tokens.values()].sort((a,b) => {
                const delta = b[1] - a[1];
                if (isFinite(delta)) {
                    return delta;
                } else {
                    return isFinite(a[1]) ? -1: 1;
                }
            });

            if (sorted.length === 0) {
                console.log(`No items matching "${text}".`);
            } else {
                for (const [token, score] of sorted) {
                    const scoreText = rightJustify(score.toFixed(3), 6);
                    if (token.type === ENTITY) {
                        console.log(`${scoreText}: ${token.name} (${token.pid})`);
                    } else if (token.type === OPTION) {
                        console.log(`${scoreText}: ${token.name} (${token.id})`);
                    }
                }
            }
            console.log(' ');


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
    
            const graph = lexer.createGraph(text);
            const tokenizations = lexer.tokenizationsFromGraph2(graph);

            let counter = 0;
            for (const tokenization of tokenizations) {
                const tokens = tokenization.tokens;
                console.log(`${counter}: ${tokens.map(tokenToString).join(' ')}`);
                counter++;
            }
    
            repl.displayPrompt();
        }
    });

    repl.defineCommand('menu', {
        help: "Display menu",
        action(line: string) {
            if (line.length === 0) {
                // No Key or PID was specified. Print out name of all of the
                // MENUITEM generics.
                for (const item of catalog.genericEntities()) {
                    if (item.kind === MENUITEM) {
                        console.log(`${item.name} (${item.pid})`);
                    }
                }
            }
            else if (line.indexOf(':') !== -1) {
                // This is a specific entity. Just print out its options.
                const key = line.trim();

                if (!catalog.hasKey(key)) {
                    console.log(`${style.red.open}Unknown Key ${key}${style.red.close}`);
                } else {
                    const specific = catalog.getSpecific(key);
                    console.log(`${specific.name} (${specific.key})`);

                    console.log(`  Options for ${specific.name}:`);
                    for (const childPID of world.ruleChecker.getValidChildren(key)) {
                        if (catalog.hasPID(childPID)) {
                            const child = catalog.getGeneric(childPID);
                            console.log(`    ${child.name} (${child.pid})`);
                        }
                    }
                }
            } else if (!isNaN(Number(line))) {
                // This is a generic entity. Print out its attributes and options.
                const pid: PID = Number(line);

                if (!catalog.hasPID(pid)) {
                    console.log(`${style.red.open}Unknown PID ${pid}${style.red.close}`);
                } else {
                    const item = catalog.getGeneric(Number(line));
                    console.log(`${item.name} (${item.pid})`);

                    console.log('  Aliases:');
                    for (const alias of item.aliases) {
                        const pattern = patternFromExpression(alias);
                        for (const text of aliasesFromPattern(pattern)) {
                            console.log(`    ${text}`);
                        }
                    }

                    console.log('  Attributes:');
                    const tensor = world.attributeInfo.getTensor(item.tensor);
                    for (const dimension of tensor.dimensions) {
                        console.log(`    ${dimension.name}`);
                        for (const attribute of dimension.attributes) {
                            console.log(`      ${attribute.name} (${attribute.aid})`);
                        }
                    }

                    console.log('  Specifics:');
                    for (const key of catalog.getSpecificsForGeneric(pid)) {
                        const name = catalog.getSpecific(key).name;
                        console.log(`    ${name} (${key})`);
                    }

                    const specific = catalog.getSpecific(item.defaultKey);

                    console.log(`  Options for ${specific.name}:`);
                    for (const childPID of world.ruleChecker.getValidChildren(item.defaultKey)) {
                        if (catalog.hasPID(childPID)) {
                            const child = catalog.getGeneric(childPID);
                            console.log(`    ${child.name} (${child.pid})`);
                        }
                    }
                }
            }
            else {
                // Parameter doesn't seem to be a Key or PID.
                // Try using the tokenizer to identify it.
                const graph = lexer.createGraph(line);
                const tokenization = lexer.tokenizationsFromGraph2(graph).next().value;

                const tokens = new Set<EntityToken | OptionToken>();
                for (const edge of tokenization.graph.edgeLists[0]) {
                    const token = lexer.tokenizer.tokenFromEdge(edge) as EntityToken | OptionToken;
                    if (token.type === ENTITY || token.type === OPTION) {
                        tokens.add(token);
                    }
                }

                const sorted = [...tokens.values()].sort((a,b) => a.name.localeCompare(b.name));

                if (sorted.length === 0) {
                    console.log(`No items matching "${line}".`);
                } else {
                    for (const token of sorted) {
                        if (token.type === ENTITY) {
                            console.log(`${token.name} (${token.pid})`);
                        } else if (token.type === OPTION) {
                            console.log(`${token.name} (${token.id})`);
                        }
                    }
                }
                console.log(' ');
            }
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

                    // Need to build YAML test cases here because of the async await.
                    // Build them proactively in case they are needed by the .yaml command.
                    // TODO: This is o(n^2). Come up with a better approach, as this will
                    // be problematic in the .load case.
                    if (recordMode) {
                        const session = stack[stack.length - 1];
                        session.utterances.push(text);
                        session.yamlTestCases = await cartYaml(
                            processor,
                            catalog,
                            session.utterances,
                            1,
                            ['unverified']
                        );
                    }

                    const session = stack[stack.length -1];
                    session.state = await processor(text, session.state);
                    const order: TestOrder = formatCart(session.state.cart, catalog);
                    const orderText = OrderOps.formatOrder(order);
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
                    // console.log();
                    console.log(`${style.reset.open}`);
                }
            }

            callback(null, '');
        }
    }

    function myWriter(text: string) {
        return text;
    }
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

// Generate a collection of yamlTestCase records from an array of input
// lines, each of which provides the input to a test case. Uses the
// observed output as the expected output.
async function cartYaml(
    processor: Processor,
    catalog: ICatalog,
    lines: string[],
    priority: number,
    suites: string[]
): Promise<YamlTestCase[]> {
    const emptyOrder: TestOrder = { lines: [] };

    const testLines = lines.map(x => x.trim()).filter(x => x.length > 0);
    const expected = lines.map(x => emptyOrder);
    const testCase = new TestCase(
        0,
        String(priority),
        suites,
        'generated by repl',
        testLines,
        expected
    );

    // Create a TestSuite from the TestCase, and then run it to collect
    // the observed output.
    const suite = new TestSuite([testCase]);
    const results = await suite.run(processor, catalog, undefined);

    // Generate a yamlTestCase from each Result, using the observed output
    // for the expected output.
    return results.rebase();
}

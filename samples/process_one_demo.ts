import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';
import { createWorld, TestCase, TestLineItem, TestOrder } from 'prix-fixe';

import { createShortOrderWorld, ShortOrderWorld } from '../src';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Process one query');
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

async function go(utterances: string[]) {
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

    const world = createWorld(dataPath);
    const shortOrderWorld = createShortOrderWorld(world, dataPath, undefined, true);
    const processor = shortOrderWorld.processor;

    const testCase = new TestCase(
        0,
        'priority',
        ['suites'],
        'comment',
        utterances,
        utterances.map( x => ({ lines: [] }))
    );

    console.log('UTTERANCES:');
    for (const [i, utterance] of utterances.entries()) {
        console.log(`  ${i}: "${utterance}"`);
    }
    console.log(' ');
    console.log('Cart');

    const result = await testCase.run(processor, world.catalog);

    OrderOps.printOrder(result.observed[utterances.length - 1]);
}

export class OrderOps {
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

function printFrequencies(world: ShortOrderWorld, text: string) {
    const terms = text.split(/\s+/);
    const stemmed = terms.map(world.lexer.lexicon.termModel.stem);
    const hashed = stemmed.map(world.lexer.lexicon.termModel.hashTerm);

    const tokenizer = world.lexer.tokenizer;
    const hashToFrequency = tokenizer['hashToFrequency'] as { [hash: number]: number };

    type Id = number;
    const postings = tokenizer['postings'] as { [hash: number]: Id[] };

    for (let i = 0; i < terms.length; ++i) {
        const frequency = hashToFrequency[hashed[i]];
        const ids = postings[hashed[i]];
        console.log(`"${terms[i]}": ${frequency}, ${ids.length}`);
    }
}

// go(['i added a soy latte']);
// go([
//     "ok i added a soy latte",
//     "ok i added one two percent milk latte with two one percent lattes iced with decaf"
// ]);

// go([
//     "ok i added a soy latte iced",
//     "ok i added an espresso",
//     "ok i made that latte iced mocha"
//     // "ok i made that latte a mocha"
//     // WORKS "ok I changed that latte into a solo espresso"
//     // WORKS "ok I replaced that latte with an double espresso"
// ]);

// go([
//     "i added a decaf latte",
//     "i made that latte a cappuccino"
// ]);


import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';
import {
    createWorld2,
    TestCase,
    TestLineItem,
    TestOrder,
    CorrectionLevel
} from 'prix-fixe';

import { createShortOrderWorld, loadShortOrderWorld, ShortOrderWorld } from '../src';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Process one query');
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-h|help|?] [-t termModel]`);
    console.log('');
    console.log('-d <datapath>   Path to prix-fixe data files.');
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
    console.log('-t <termModel>  One of snowball, metaphone, or hybrid.');
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

    const world = createWorld2(dataPath);
    // const shortOrderWorld = createShortOrderWorld(world, dataPath, args.t, true);
    const shortOrderWorld = loadShortOrderWorld(world, dataPath, args.t, true);
    const processor = shortOrderWorld.processor;

    const steps = utterances.map( x => ({
        rawSTT: x,
        cart: []
    }));
    const testCase = new TestCase(
        0,
        // 'priority',
        ['suites'],
        'comment',
        steps
        // utterances,
        // utterances.map( x => ({ lines: [] }))
    );

    console.log('UTTERANCES:');
    for (const [i, utterance] of utterances.entries()) {
        console.log(`  ${i}: "${utterance}"`);
    }
    console.log(' ');
    console.log('Cart');

    const result = await testCase.run(
        processor,
        world.catalog,
        CorrectionLevel.Raw
    );

    OrderOps.printOrder(result.observed[utterances.length - 1]);
}

export class OrderOps {
    // TODO: does this convenience method really belong here?
    static printOrder(order: TestOrder) {
        console.log(OrderOps.formatOrder(order));
    }

    static formatOrder(order: TestOrder) {
        return order.cart.map(OrderOps.formatLineItem).join('\n');
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

// go(['add a soy latte']);
// go([
//     "i want a soy latte",
//     "ok i'd like one two percent milk latte with two one percent lattes iced with decaf"
// ]);

// go([
//     "i want a soy latte iced",
//     "i want an espresso",
//     "i make that latte iced mocha"
//     // "make that latte a mocha"
//     // WORKS "change that latte into a solo espresso"
//     // WORKS "replace that latte with an double espresso"
// ]);

// go([
//     "add a decaf latte",
//     "make that latte a cappuccino"
// ]);

go([
  "skinny vanilla cinnamon latte please"
    ///////////////////////////////////////////////////////////////////////////
    // Allowing PRODUCT_0, PRODUCT_1, PRODUCT_N
    ///////////////////////////////////////////////////////////////////////////
    // "i want a decaf latte",
    // "make that latte a cappuccino"

    // Recipe bug
    // "add a double double"

    // Testing lexicon.yaml
    // "i want a five pump caramel flat white",

    // Exception thrown when using coalesceGraph
    // "add one double iced ristretto one third caf",

    // fuzzerB2: 10, simplified
    // "add a grande chai latte with some water",

    // // fuzzerB: 81, simplified
    // "add a decaf latte with two percent milk and some eggnog",

    // // 1018
    // "i want a coffee and an espresso",
    // "can i get room in the coffee"

    // // 1024
    // "add a latte with splenda",
    // "remove the splenda"

    // // 1019
    // "add a latte and an americano",
    // "make that to go"
    // This was fixed by adding "replace" to the MODIFY aliases.
    // May want separate case for replace/substitute
    //   "replace a with b"
    //   "substitute b for a"
    // "add an espresso",
    // "replace that espresso with a tall iced latte"

    // "i'd like a coffee one and one"

    // "i'd like a double double"
    // "i'd like a latte and a flat white",
    // "make that latte decaf"

    // "i'd like a latte",
    // "make that a decaf"

    // // CURRENT TASK
    // // 61
    // "i'd like a decaf latte",
    // "actually make that a cappuccino"

    // // 1014
    // "add a muffin",
    // "i'd like that warmed"

    // // 52
    // "add a cappuccino",
    // "change that cappuccino to decaf"

    // // 38
    // "i want a latte latte macchiato and a chai latte",
    // "remove the latte macchiato"

    // STILL DOESN'T WORK
    // // 60.2
    // "i want a latte",
    // "i want that with a lid"

    // STILL DOESN'T WORK
    // "i want an espresso",
    // "replace that espresso with a tall iced latte"

    // "i'd like a decaf latte",
    // "actually make that a cappuccino"

    // "add a latte with two sugar",
    // "add a sugar"
    // "add five more sugar"

    // "i want a coffee one and one",
    // "i want a latte double espresso and a muffin",
    // "i want a muffin with strawberry halved",
    // "i'd like an extra wet latte",
    // "i'd like a soy vanilla latte",
    // "i'd like a vanilla latte"
    // "i want a tall latte",
    // "remove that tall latte"
]);

// NOP: Hi um i'd like a ah a latte with vanilla syrup
// OK: Actually make that an iced decaf and add a muffin
// ADDS A MUFFIN: And can you warm the muffin
// NOP: Warm that




// vanilla latte => correct
// two pump vanilla latte => incorrect - gives two lattes with one pump vanilla
// five two pump vanilla latte => correct
// a two pump vanilla latte => correct


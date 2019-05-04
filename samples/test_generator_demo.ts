import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
// import * as yaml from 'js-yaml';

import { AnyToken, setup, TestSuite, TokenizerFunction } from '../src';
import {
    formatInstanceAsText,
    Quantity,
    Random,
    RandomOrders,
    RandomProducts
} from '../src';

function usage() {
    console.log(`TODO: print usage here.`);
}

async function go() {
    // const args = minimist(process.argv.slice(2));

    // if (args._.length !== 1) {
    //     const message = 'Expected output file on command line.';
    //     console.log(message);
    //     usage();
    //     return;
    // }

    // const outfile = args._[0];

    const world = setup(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.yaml'),
        false
    );

    const entityQuantities: Quantity[] = [
        { value: 1, text: 'a' },
        { value: 1, text: 'one' },
        { value: 2, text: 'two' }
    ];

    const optionQuantities: Quantity[] = [
        { value: 0, text: 'no' },
        { value: 0, text: 'without [any]' },
        { value: 1, text: '' },
        { value: 1, text: 'a (pump,squirt) [of]' },
        { value: 1, text: 'some' },
        { value: 1, text: 'one (pump,squirt) [of]' },
        { value: 2, text: 'two (pumps,squirts) [of]' }
    ];

    const prologueAliases = [
        "(I'd,I would) like",
        "(I'll,I will) (do,get,have,take)",
        "[please] (get,give) me",
        "could I (have,get)"
    ];

    const epilogueAliases = [
        "that's (all,it)",
        "[and] (that'll,that will) (do it,be all)",
        "thanks",
        "thank you"
    ];

    //
    // Generate and print a selection of utterances.
    //
    const optionIds = [200000, 200001];

    const random = new Random('seed1');
    const randomProducts = new RandomProducts(
        world.catalog,
        world.attributeInfo,
        world.attributes,
        entityQuantities,
        optionIds,
        optionQuantities,
        random);

    const orders = new RandomOrders(prologueAliases, randomProducts, epilogueAliases);
    let counter = 0;
    const limit = 50;
    for (const instances of orders.orders()) {
        if (counter >= limit) {
            break;
        }
        counter++;
        const text = instances.map(formatInstanceAsText).join(' ');
        console.log(text);
    }

    // // Set up tokenizer
    // const tokenizer: TokenizerFunction = async (utterance: string): Promise<IterableIterator<AnyToken>> =>
    //     (world.unified.processOneQuery(utterance) as AnyToken[]).values();

    // // Run test suite to get new baseline.
    // const priority = 0;
    // const suites: string[] = [];
    // const results = await TestSuite.fromInputLines(
    //     world,
    //     tokenizer,
    //     lines,
    //     priority,
    //     suites);

    // const yamlText = yaml.safeDump(results, { noRefs: true });

    // const outfilePath = path.resolve(__dirname, outfile);
    // fs.writeFileSync(outfilePath, yamlText, 'utf-8');

    // console.log(`Rebased to "${outfilePath}"`);
}

go();

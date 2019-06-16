import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import {
    setup,
    State,
} from 'prix-fixe';

import {
    createTestCase,
    formatInstanceAsText,
    Random,
    RandomOrders,
    RandomProducts,
    testOrdersIdentical,
} from '../src/fuzzer2';

import {
    LexicalAnalyzer,
    Quantity,
    tokenToString,
    ADD_TO_ORDER,
} from '../src';

// TODO: temporary direct import because of export conflict.
import {
    Parser2,
    SequenceToken
} from '../src/parser2';


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

    const productsFile = path.join(__dirname, '../../samples2/data/restaurant-en/products.yaml');
    const optionsFile = path.join(__dirname, '../../samples2/data/restaurant-en/options.yaml');
    const attributesFile = path.join(__dirname, '../../samples2/data/restaurant-en/attributes.yaml');
    const rulesFile = path.join(__dirname, '../../samples2/data/restaurant-en/rules.yaml');
    const intentsFiles = path.join(__dirname, '../../samples2/data/restaurant-en/intents.yaml');
    const quantifiersFile = path.join(__dirname, '../../samples2/data/restaurant-en/quantifiers.yaml');
    const unitsFile = path.join(__dirname, '../../samples2/data/restaurant-en/units.yaml');
    const stopwordsFile = path.join(__dirname, '../../samples2/data/restaurant-en/stopwords.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    // Set up lexer
    const lexer = new LexicalAnalyzer(
        world,
        intentsFiles,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
        false
    );

    const parser = new Parser2(world.cartOps, world.attributeInfo, world.ruleChecker);

    const processor = async (text: string, state: State): Promise<State> => {
        const tokens = lexer.processOneQuery(text);
        // TODO: split debug tracing
        console.log(tokens.map(tokenToString).join(''));

        // TODO: HACK
        // TODO: Remove this code once the parser handles intents.
        if (tokens.length > 0 && tokens[0].type === ADD_TO_ORDER) {
            tokens.shift();
        }

        const interpretation = parser.findBestInterpretation(tokens as SequenceToken[]);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

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
    const entityIds = [8000, 9000];
    const optionIds = [5000, 6000, 7000];

    const random = new Random('seed1');
    const randomProducts = new RandomProducts(
        world.catalog,
        world.attributeInfo,
        world.attributes,
        entityQuantities,
        entityIds,
        optionIds,
        optionQuantities,
        random);

    const orders = new RandomOrders(prologueAliases, randomProducts, epilogueAliases);
    let counter = 0;
    const limit = 50;
    let passedCount = 0;
    let failedCount = 0;

    for (const instances of orders.orders()) {
        if (counter >= limit) {
            break;
        }
        counter++;
        const text = instances.map(formatInstanceAsText).join(' ');
        console.log(text);
        // console.log(instances.map(formatInstanceDebug).join(' '));

        const testCase = createTestCase(world.catalog, world.attributeInfo, instances);
        const result = await testCase.run(processor, world.catalog);
        // console.log(`Test status: ${result.passed?"PASSED":"FAILED"}`);

        const ok = testOrdersIdentical(testCase.expected[0], result.observed[0]);
        console.log(`Test status: ${ok ? "PASSED" : "FAILED"}`);
        if (ok) {
            passedCount++;
        }
        else {
            failedCount++;
        }
        console.log('');

        // if (!result.passed) {
        // if (!ok) {
        //         explainDifferences(result.observed[0], testCase.expected[0]);
        // }

        console.log();
    }

    console.log('');
    console.log(`failed: ${failedCount}`);
    console.log(`passed: ${passedCount}`);
    console.log(`fraction: ${passedCount}/${passedCount + failedCount}`);

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

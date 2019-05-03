import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
// import * as yaml from 'js-yaml';

import { AnyToken, setup, TestSuite, TokenizerFunction, Quantity, Dimension } from '../src';
import { CodedInstances, EntityGenerator, formatInstance, ModifierGenerator, OptionGenerator, PermutedGenerator } from '../src';

function usage() {
    console.log(`TODO: print usage here.`);
}

async function go() {
    const args = minimist(process.argv.slice(2));

    if (args._.length !== 2) {
        const message = 'Expected input file and output file on command line.';
        console.log(message);
        usage();
        return;
    }

    const infile = args._[0];
    const outfile = args._[1];

    const infilePath = path.resolve(__dirname, infile);
    console.log(`Rebasing from "${infilePath}"`);

    const inputText = fs.readFileSync(infilePath, 'utf-8');
    const lines = inputText.split(/\r?\n/);

    const world = setup(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.yaml'),
        false
    );

    const entities = new EntityGenerator(world.attributeInfo, world.catalog, 9000);
    for (const version of entities.versions()) {
        const text = version.instances.map(formatInstance).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    console.log('');

    const id = 17;
    const instances = entities.version(id);
    const text = instances.map(formatInstance).join(' ');
    console.log(`${id}: ${text}`);

    console.log('');
    console.log('Permutations');

    const permuted = new PermutedGenerator(instances);
    for (const version of permuted.versions()) {
        const text = version.instances.map(formatInstance).join(' ');
        console.log(`(${id},${version.id}): ${text}`);
    }

    console.log('');
    console.log('Modifiers');

    const milk = 5;
    const dimension = world.attributeInfo.getDimension(milk) as Dimension;
    const modifiers = new ModifierGenerator(dimension);
    for (const version of modifiers.versions()) {
        const text = version.instances.map(formatInstance).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    console.log('');
    console.log('Options:');

    // TODO: make this text aliases, e.g. 'two [pumps,squirts]'
    const quantities: Quantity[] = [
        { value: 0, text: 'no'},
        { value: 0, text: 'without [any]'},
        { value: 1, text: ''},
        { value: 1, text: 'a (pump,squirt) [of]'},
        { value: 1, text: 'some'},
        { value: 1, text: 'one (pump,squirt) [of]'},
        { value: 2, text: 'two (pumps,squirts) [of]'}
    ];

    const options = new OptionGenerator(world.catalog, 200000, quantities);
    for (const version of options.versions()) {
        const text = version.instances.map(formatInstance).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    console.log('');
    console.log('Statistics:');

    console.log(`entities: ${entities.count()}`);
    console.log(`modifiers: ${modifiers.count()}`);
    console.log(`options: ${options.count()}`);
    console.log(`product: ${entities.count() * modifiers.count() * options.count()}`);

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
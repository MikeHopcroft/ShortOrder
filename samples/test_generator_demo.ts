import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
// import * as yaml from 'js-yaml';

import { AnyToken, setup, TestSuite, TokenizerFunction, Quantity, Dimension, CompositeGenerator, AliasGenerator, MapGenerator, addQuantity } from '../src';
import { CodedInstances, EntityGenerator, formatInstanceAsText, formatInstanceDebug, linguisticFixup, ModifierGenerator, OptionGenerator, PermutationGenerator } from '../src';

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

    //
    // Configure EntityGenerator for a single entity.
    //
    const entityId = 9000;

    const entityQuantities: Quantity[] = [
        { value: 1, text: 'a'},
        { value: 1, text: 'one'},
        { value: 2, text: 'two'}
    ];

    const entities = new EntityGenerator(world.attributeInfo, world.catalog, entityId, entityQuantities);
    for (const version of entities.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    console.log('');

    const id = 17;
    const instances = entities.version(id);
    const text = instances.map(formatInstanceDebug).join(' ');
    console.log(`${id}: ${text}`);

    console.log('');
    console.log('Permutations');

    const permuted = new PermutationGenerator(instances);
    for (const version of permuted.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`(${id},${version.id}): ${text}`);
    }

    //
    // Configure ModifierGenerator for a single dimension.
    //
    console.log('');
    console.log('Modifiers');

    const milk = 5;
    const dimension = world.attributeInfo.getDimension(milk) as Dimension;
    const modifiers = new ModifierGenerator(dimension);
    for (const version of modifiers.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    //
    // Configure OptionGenerator for a single option.
    //
    console.log('');
    console.log('Options:');

    const modifierId = 200000;

    // TODO: make this text aliases, e.g. 'two [pumps,squirts]'
    const optionQuantities: Quantity[] = [
        { value: 0, text: 'no'},
        { value: 0, text: 'without [any]'},
        { value: 1, text: ''},
        { value: 1, text: 'a (pump,squirt) [of]'},
        { value: 1, text: 'some'},
        { value: 1, text: 'one (pump,squirt) [of]'},
        { value: 2, text: 'two (pumps,squirts) [of]'}
    ];

    const options = new OptionGenerator(world.catalog, modifierId, optionQuantities);
    for (const version of options.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`${version.id}: ${text}`);
    }


    //
    // Configure AliasGenerator for prologues.
    //
    console.log('');
    console.log('Prologues:');

    const prologueAliases = [
        "(I'd,I would) like",
        "(I'll,I will) (do,get,have,take)",
        "[please] (get,give) me",
        "could I (have,get)"
    ];
    const prologues = new AliasGenerator(prologueAliases);
    for (const version of prologues.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`${version.id}: ${text}`);
    }



    //
    // Configure AliasGenerator for epilogues.
    //
    console.log('');
    console.log('Epilogues:');

    const epilogueAliases = [
        "that's (all,it)",
        "[and] (that'll,that will) (do it,be all)",
        "thanks",
        "thank you"
    ];
    const epilogues = new AliasGenerator(epilogueAliases);
    for (const version of epilogues.versions()) {
        const text = version.instances.map(formatInstanceDebug).join(' ');
        console.log(`${version.id}: ${text}`);
    }

    //
    // Configure CompositeGenerator that combines the entity with its modifiers
    // and options.
    //
    console.log('');
    console.log('Product:');

    const unquantifiedProduct = new CompositeGenerator([
        // prologues, quantities, entities, modifiers, options, epilogues
        // entities, modifiers, options, epilogues
        entities, modifiers, options
    ]);

    //
    // Configure MapGenerator that adds the entity's quantity and performs
    // linguistic fixup for the phrase.
    //
    const product = new MapGenerator(unquantifiedProduct, [addQuantity, linguisticFixup]);
    console.log(`total: ${product.count()}`);

    const order = new CompositeGenerator([prologues, product, epilogues]);


    console.log('');
    console.log('Statistics:');

    console.log(`entities: ${entities.count()}`);
    console.log(`modifiers: ${modifiers.count()}`);
    console.log(`options: ${options.count()}`);
    console.log(`productA: ${entities.count() * modifiers.count() * options.count()}`);
    console.log(`productB: ${product.count()}`);
    console.log(`order: ${order.count()}`);

    //
    // Generate and print a selection of utterances.
    //
    for (const id of [0, 1, 10, 100, 123, 1000, 1234, 2000, 2345, 3000, 5000, 7000, 9000, 10000, 20000, 40000, 80000, 160000,300000]) {
        const instances = order.version(id);
        // const instances = linguisticFixup(product.version(id));
        const text = instances.map(formatInstanceAsText).join(' ');
        // const text = instances.map(formatInstance).join(' ');
        // const text = instances.map(x => x.alias).join(' ');
        console.log(`${id}: ${text}`);
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

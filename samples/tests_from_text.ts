import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as minimist from 'minimist';
import * as path from 'path';
import { createWorld, Catalog, TestSuite } from 'prix-fixe';

import {
    createShortOrderWorld,
    speechToTextFilter,
} from '../src';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Generate test cases from utterances');
    console.log('');
    console.log('This utility uses the short-order parser to make test cases');
    console.log('from an input file of utterances. Note that the short-order');
    console.log('parser may produce incorrect carts, so it is necessary to');
    console.log('inspect the resulting YAML file and fixup or remove cases');
    console.log('with incorrect carts. Each generated case will be marked as');
    console.log('unverified. It is recommended that the user remove this tag');
    console.log('from each case that is correctly constructed.');
    console.log('');
    console.log(`Usage: node ${program} <input> <output> [-d datapath] [-h|help|?]`);
    console.log('');
    console.log('<input>         Path to a file of utterances, one per line.');
    console.log('<output>        YAML test cases will be written to this file.');
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

async function go() {
    dotenv.config();
    const args = minimist(process.argv.slice(2));

    if (args._.length !== 2) {
        const message = 'Expected input file and output file on command line.';
        console.log(message);
        showUsage();
        return;
    }

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

    const infile = args._[0];
    const outfile = args._[1];

    const infilePath = path.resolve(__dirname, infile);
    console.log(`Rebasing from "${infilePath}"`);

    //
    // Read in utterances
    //
    const inputText = fs.readFileSync(infilePath, 'utf-8');
    const lines = inputText.split(/\r?\n/);

    //
    // Set up short-order processor
    //
    const world = createWorld(dataPath);
    const processor = createShortOrderWorld(world, dataPath, false).processor;

    // Run test suite to get new baseline.
    const priority = 0;
    const suites: string[] = [];
    const results = await TestSuite.fromInputLines(
        processor,
        world.catalog as Catalog,
        speechToTextFilter,
        lines,
        priority,
        suites);

    const yamlText = yaml.safeDump(results, { noRefs: true });

    const outfilePath = path.resolve(__dirname, outfile);
    fs.writeFileSync(outfilePath, yamlText, 'utf-8');

    console.log(`Rebased to "${outfilePath}"`);
}

go();

import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { AnyToken, setup, TestSuite, TokenizerFunction } from '../src';

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

    // Set up tokenizer
    const tokenizer: TokenizerFunction = async (utterance: string): Promise<IterableIterator<AnyToken>> =>
        (world.unified.processOneQuery(utterance) as AnyToken[]).values();

    // Run test suite to get new baseline.
    const priority = 0;
    const suites: string[] = [];
    const results = await TestSuite.fromInputLines(
        world,
        tokenizer,
        lines,
        priority,
        suites);

    const yamlText = yaml.safeDump(results, { noRefs: true });

    const outfilePath = path.resolve(__dirname, outfile);
    fs.writeFileSync(outfilePath, yamlText, 'utf-8');

    console.log(`Rebased to "${outfilePath}"`);
}

go();

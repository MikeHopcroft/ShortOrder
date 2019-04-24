import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { AnyToken, setup, TestSuite, TokenizerFunction } from '../src';

// TODO: input file
// TODO: output file
// TODO: refactor into separate suite rebasing function.
// TODO: flag for restricting rebase to name field.

async function go() {
    const args = minimist(process.argv.slice(2));

    // const defaultTestFile = './data/restaurant-en/test_suite.yaml';
    // const testFile = path.resolve(__dirname, args['f'] || defaultTestFile);

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

    const lines = ['a hamburger with no pickles', 'two small soy lattes'];
    const results = await TestSuite.fromInputLines(
        world,
        tokenizer,
        lines,
        0,
        ['a', 'b']);

    const yamlText = yaml.safeDump(results, { noRefs: true });

    console.log(yamlText);
}

go();

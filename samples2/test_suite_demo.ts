import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { State, TestSuite } from 'prix-fixe';

import { createWorld, createShortOrderProcessor } from '../src/fuzzer3';

// This processor does nothing. Replace it with code that processes the text
// utterance to produce a new State.
async function nopProcessor(text: string, state: State): Promise<State> {
    return state;
}

async function go() {
    const args = minimist(process.argv.slice(2));

    const defaultTestFile = './data/restaurant-en/test_suite.yaml';
    const testFile = path.resolve(__dirname, args['f'] || defaultTestFile);

    const showAll = args['a'] === true;
    const suiteFilter = args['s'];

    if (suiteFilter) {
        console.log(`Running tests in suite: ${suiteFilter}`);
    } else {
        console.log('Running all tests.');
    }

    const dataPath = path.join(__dirname, '../../samples2/data/restaurant-en/');
    const world = createWorld(dataPath);
    const processor = createShortOrderProcessor(world, dataPath, false);

    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    const aggregator = await suite.run(processor, world.catalog, suiteFilter);
    aggregator.print(showAll);
}

go();

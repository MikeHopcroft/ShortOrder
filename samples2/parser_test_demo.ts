import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { setup, TestSuite } from 'prix-fixe';

import { createProcessor } from '../src';

async function go() {
    const args = minimist(process.argv.slice(2));

    const defaultTestFile = '../../samples2/data/restaurant-en/parser_suite.yaml';
    const testFile = path.resolve(__dirname, args['f'] || defaultTestFile);

    const showAll = args['a'] === true;
    const suiteFilter = args['s'];

    if (suiteFilter) {
        console.log(`Running tests in suite: ${suiteFilter}`);
    } else {
        console.log('Running all tests.');
    }

    const productsFile = path.join(__dirname, '../../samples2/data/restaurant-en/products.yaml');
    const optionsFile = path.join(__dirname, '../../samples2/data/restaurant-en/options.yaml');
    const attributesFile = path.join(__dirname, '../../samples2/data/restaurant-en/attributes.yaml');
    const rulesFile = path.join(__dirname, '../../samples2/data/restaurant-en/rules.yaml');
    const intentsFile = path.join(__dirname, '../../samples2/data/restaurant-en/intents.yaml');
    const quantifiersFile = path.join(__dirname, '../../samples2/data/restaurant-en/quantifiers.yaml');
    const unitsFile = path.join(__dirname, '../../samples2/data/restaurant-en/units.yaml');
    const stopwordsFile = path.join(__dirname, '../../samples2/data/restaurant-en/stopwords.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    const processor = createProcessor(
        world,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    const aggregator = await suite.run(processor, world.catalog, suiteFilter);
    aggregator.print(showAll);
}

go();

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { TestSuite } from 'prix-fixe';

import {
    createShortOrderWorld,
    createWorld,
} from '../src';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Run test cases from YAML file');
    console.log('');
    console.log('This utility uses the short-order parser to run test cases');
    console.log('from an YAML input file.');
    console.log('');
    console.log(`Usage: node ${program} <input> [-d datapath] [-h|help|?]`);
    console.log('');
    console.log('<input>         Path to a file of YAML test cases.');
    console.log('');
    console.log('-a              Print results for all tests, passing and failing.');
    console.log('-x              Do not verify intermediate results.'); 
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
    console.log('-s suite        Run tests in specified suite.');
    console.log(' ');
}

async function go() {
    dotenv.config();

    console.log('ShortOrder test runner');
    console.log(new Date().toLocaleString());

    const args = minimist(process.argv.slice(2));

    if (args._.length !== 1) {
        const message = 'Expected YAML input file on command line.';
        console.log(message);
        showUsage();
        return;
    }
    const testFile = args._[0];
    console.log(`test file = ${testFile}`);

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        console.log('Use -d flag or PRIX_FIXE_DATA environment variable to specify data path');
        return;
    }
    console.log(`data path = ${dataPath}`);

    if (args.h || args.help || args['?']) {
        showUsage();
        return;
    }

    const showAll = args['a'] === true;
    const skipIntermediate = args['x'] === true;

    const suiteFilter = args['s'];
    if (suiteFilter) {
        console.log(`Running tests in suite: ${suiteFilter}`);
    } else {
        console.log('Running all tests.');
    }

    //
    // Set up short-order processor
    //
    const world = createWorld(dataPath);
    const processor = createShortOrderWorld(world, dataPath, false).processor;

    //
    // Run the tests
    //
    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    const aggregator = await suite.run(
        processor,
        world.catalog,
        suiteFilter,
        false,
        !skipIntermediate
    );
    aggregator.print(showAll);

    console.log('');
    console.log('');
}

go();

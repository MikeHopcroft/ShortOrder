import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { setup, State, TestSuite } from 'prix-fixe';

import { LexicalAnalyzer, tokenToString } from '../src';

// TODO: temporarily importing from parser2 directory because of export
// conflicts during refactor.
import { Parser2, SequenceToken } from '../src/parser2';


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
    const intentsFiles = path.join(__dirname, '../../samples2/data/restaurant-en/intents.yaml');
    const quantifiersFile = path.join(__dirname, '../../samples2/data/restaurant-en/quantifiers.yaml');
    const unitsFile = path.join(__dirname, '../../samples2/data/restaurant-en/units.yaml');
    const stopwordsFile = path.join(__dirname, '../../samples2/data/restaurant-en/stopwords.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

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
        console.log(tokens.map(tokenToString).join(''));

        const interpretation = parser.findBestInterpretation(tokens as SequenceToken[]);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    await suite.run(processor, world.catalog, showAll, suiteFilter);
}

go();

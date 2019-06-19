import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
    AID,
    setup,
    World,
    Processor,
    ICatalog,
    TestCase,
    AggregatedResults
} from 'prix-fixe';

import { createProcessor } from '../src';

// TODO: Currently importing directly from fuzzer3 because of export conflicts
// during refactoring. Change this import to '../src' once refactoring is done.
import {
    AliasGenerator,
    AttributeGenerator,
    createTestCase,
    EITHER,
    EntityGenerator,
    makeTests,
    OptionGenerator,
    OrderGenerator,
    Position,
    ProductGenerator,
    LEFT,
    QuantityX,
    RIGHT,
    Random,
    runTests,
    OrderX,
} from '../src/fuzzer3';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Test case generator');
    console.log(`useage: node ${program} [-n count] [-o outfile] [-v] [-h|help|?]`);
    console.log('');
    console.log('-n count       Number of test cases to generate.');
    console.log('-o outfile     Write cases to YAML file.');
    console.log('               Without -o, cases will be printed to the console.');
    console.log('-v [so|dse]    Run the generated cases through the short-order parser (so).');
    console.log('               or the domain-specific-entity processor (dse).');
    console.log('-h|help|?      Show this message.');
}

async function go()
{
    const args = minimist(process.argv);

    // TODO: get dataPath from command-line
    const dataPath = path.join(__dirname, '../../samples2/data/restaurant-en/');

    const outFile = args['o'] ? path.resolve(__dirname, args['o']) : undefined;
    const verify = args['v'];

    const defaultCount = 10;
    const count = (args['n'] || defaultCount);

    const help = 
        (args['h'] === true) || 
        (args['help'] === true) ||
        (args['h'] === true);

    if (help) {
        showUsage();
    }
    else {
        console.log(`Generating ${count} test case${count === 1 ? "":"s"}.`);
        if (verify) {
            console.log(`Performing short-order verification.`);
        }
        if (outFile) {
            console.log(`Writing cases to ${outFile}.`);
        }

        go2(dataPath, count, verify, outFile);
    }
}

async function go2(
    dataPath: string,
    count: number,
    verify: string | undefined,
    outFile: string | undefined) {
    const world = createWorld(dataPath);

    const orders = generateOrders(world, count);

    ///////////////////////////////////////////////////////////////////////////
    //
    // Run tests as they are generated.
    //
    ///////////////////////////////////////////////////////////////////////////
    let results: AggregatedResults;
    if (verify !== undefined) {
        const processor = processorFactory(verify, world, dataPath);

        results = await runTests(orders, world.catalog, processor);
        results.print(true);
    } else {
        results = makeTests(orders, world.catalog);
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Output generated cases
    //
    ///////////////////////////////////////////////////////////////////////////
    if (outFile !== undefined) {
        console.log(`Writing ${results.results.length} test cases to ${outFile}.`);
        const yamlCases = results.rebase();
        for (const yamlCase of yamlCases) {
            yamlCase.suites = 'synthetic';
        }
        const yamlText = yaml.safeDump(yamlCases, { noRefs: true });
        fs.writeFileSync(outFile, yamlText, 'utf-8');    }
        console.log(`Test cases written successfully.`);
}

function processorFactory(name: string, world: World, dataPath: string): Processor {
    if (name === 'so') {
        return createShortOrderProcessor(world, dataPath);
    }

    if (name === 'dse') {
        return createShortOrderProcessor(world, dataPath);
    }

    const message = `processorFactory: invalid processor ${name}.`;
    throw TypeError(message);
}

function* generateTestCases(
    orders: IterableIterator<OrderX>,
    catalog: ICatalog
): IterableIterator<TestCase> {
    for (const order of orders) {
        yield createTestCase(catalog, order);
    }
}

function* generateOrders(world: World, count: number): IterableIterator<OrderX> {
    ///////////////////////////////////////////////////////////////////////////
    //
    // Configure generators
    //
    ///////////////////////////////////////////////////////////////////////////
    // TODO: These should map DID to Position.
    const positions = new Map<AID, Position>();
    // Latte sizes restricted to LEFT
    positions.set(1, LEFT);
    positions.set(2, LEFT);
    positions.set(3, LEFT);
    // Espresso sizes restricted to LEFT
    positions.set(50, LEFT);
    positions.set(51, LEFT);
    positions.set(52, LEFT);
    positions.set(53, LEFT);

    const attributes = new AttributeGenerator(
        world.attributeInfo,
        world.catalog,
        positions
    );


    const entityQuantities: QuantityX[] = [
        new QuantityX(1, 'a'),
        new QuantityX(1, 'one'),
        new QuantityX(2, 'two'),
        new QuantityX(3, 'three'),
    ];

    //
    // Specific entity
    //
    // const entityGenerator = new EntityGenerator(
    //     world.attributeInfo,
    //     attributes,
    //     world.catalog,
    //     9200,
    //     entityQuantities
    // );
    const entityPIDs = [9000, 9100, 9200, 9500];
    const entityGenerators: EntityGenerator[] = [];
    for (const pid of entityPIDs) {
        const generator = new EntityGenerator(
            world.attributeInfo,
            attributes,
            world.catalog,
            pid,
            entityQuantities
        );
        entityGenerators.push(generator);
    }


    const optionLeftQuantites: QuantityX[] = [
        new QuantityX(1, ''),
        new QuantityX(1, 'one pump'),
        new QuantityX(2, 'two pump'),
        new QuantityX(3, 'three pump'),
    ];

    const optionRightQuantites: QuantityX[] = [
        new QuantityX(1, 'a pump of'),
        new QuantityX(1, 'some'),
        new QuantityX(1, 'one pump of'),
        new QuantityX(2, 'two pumps of'),
        new QuantityX(2, 'three pumps of'),
    ];

    const optionPositionPredicate = (alias: string): Position => {
        return EITHER;
    };

    const optionPIDs = [5000, 5001, 5002, 5003];
    const optionGenerators: OptionGenerator[] = [];
    for (const pid of optionPIDs) {
        const generator = new OptionGenerator(
            world.attributeInfo,
            attributes,
            world.catalog,
            pid,
            optionPositionPredicate,
            optionLeftQuantites,
            optionRightQuantites,
        );
        optionGenerators.push(generator);
    }

    const productGenerator = new ProductGenerator(
        entityGenerators,
        []
//        optionGenerators
    );

    const prologues = [
        "(I'd,I would) like",
        "(I'll,I will) (do,get,have,take)",
        "I (need,want)",
        "(get,give) me",
        "(can,could,may) I [just,please] (do,get,have)",
        "[please] set me up with",
        "[please] hook me up with",
        "we need",
        "we want",
        "(we'd,we would) like",
        "(we'll, we will) have",
        "how about",
    ];
    const prologueGenerator = new AliasGenerator(prologues);

    const epilogues = [
        "I'm (done,fine,good)",
        "thank you",
        "thanks",
        "that's (all,everything,it)",
        "(that'll,that will,that should) (be,do) it",
        "bye",
    ];
    const epilogueGenerator = new AliasGenerator(epilogues);

    const maxSegmentCount = 1;
    // const maxSegmentCount = 3;
    const orderGenerator = new OrderGenerator(
        prologueGenerator,
        productGenerator,
        maxSegmentCount,
        epilogueGenerator
    );

    const random = new Random("1234");

    for (let i = 0; i < count; ++i) {
        yield orderGenerator.randomOrder(random);
    }
}

function createWorld(dataPath: string): World {
    const productsFile = path.join(dataPath, 'products.yaml');
    const optionsFile = path.join(dataPath, 'options.yaml');
    const attributesFile = path.join(dataPath, 'attributes.yaml');
    const rulesFile = path.join(dataPath, 'rules.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    return world;
}

function createShortOrderProcessor(world: World, dataPath: string): Processor {
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const processor = createProcessor(
        world,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    return processor;
}

go();

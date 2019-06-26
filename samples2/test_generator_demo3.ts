import * as path from 'path';

import {
    AID,
    PID,
    MENUITEM,
    OPTION,
    TestCase,
    World,
} from 'prix-fixe';

// TODO: Currently importing directly from fuzzer3 because of export conflicts
// during refactoring. Change this import to '../src' once refactoring is done.
import {
    AliasGenerator,
    AttributeGenerator,
    createTestCase,
    EITHER,
    EntityGenerator,
    fuzzerMain,
    OptionGenerator,
    OrderGenerator,
    OrderX,
    Position,
    ProcessorFactory,
    ProductGenerator,
    LEFT,
    QuantityX,
    RIGHT,
    Random,
    TestCaseGeneratorFactory,
} from '../src/fuzzer3';

async function go()
{
    const testCaseGeneratorFactory = new TestCaseGeneratorFactory([
        {
            name: 'sprint4',
            description: 'single product with attributes',
            factory: generateOrders,
        }
    ]);

    // TODO: add your processors here to enable the "-v" test verification option.
    const processorFactory = new ProcessorFactory([]);

    // TODO: move this into fuzzerMain and get dataPath from command-line.
    // const dataPath = path.join(__dirname, '../../samples2/data/restaurant-en/');
    const dataPath = path.resolve(__dirname, 'd:\\git\\menudata');
    // const dataPath = path.resolve(__dirname, '/Users/mhop/git/menudata');

    // Run the fuzzer application.
    fuzzerMain(testCaseGeneratorFactory, processorFactory, dataPath);
}

///////////////////////////////////////////////////////////////////////////////
//
// Configure generators
//
///////////////////////////////////////////////////////////////////////////////
function* generateOrders(world: World, count: number): IterableIterator<TestCase> {
    //
    // Attributes
    //

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
        positions
    );


    //
    // Entities
    //
    const entityQuantities: QuantityX[] = [
        new QuantityX(1, 'a'),
        new QuantityX(1, 'one'),
        new QuantityX(2, 'two'),
        new QuantityX(3, 'three'),
    ];

    // const entityPIDs = [9000, 9100, 9200, 9500];
    // const entityPIDs = [457];
    // for (const entity of world.catalog.genericEntities)
    const entityPIDs: PID[] = [];
    // for (const entity of world.catalog.genericEntities()) {
    //     entityPIDs.push(entity.pid);
    // }
    for (const entity of world.catalog.genericEntities()) {
        // Skip over items that don't have aliases.
        if (entity.aliases.length === 0 || entity.aliases[0].length === 0) {
            continue;
        }

        if (entity.kind !== MENUITEM) {
            continue;
        }

        // Only include items for Tensor 0.
        // if (entity.tensor === 0) {
        //     entityPIDs.push(entity.pid);
        // }
        if (entity.name.indexOf('latte') !== -1) {
            entityPIDs.push(entity.pid);
        }
    }

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

    //
    // Options
    //
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
        new QuantityX(3, 'three pumps of'),
    ];

    const optionPositionPredicate = (alias: string): Position => {
        return EITHER;
    };

    const optionPIDs: PID[] = [];
    for (const entity of world.catalog.genericEntities()) {
        // Skip over items that don't have aliases.
        if (entity.aliases.length === 0 || entity.aliases[0].length === 0) {
            continue;
        }

        if (entity.kind !== OPTION) {
            continue;
        }

        optionPIDs.push(entity.pid);
    }

    // const optionPIDs = [62, 93];
    // // const optionPIDs = [5000, 5001, 5002, 5003, 10000, 10001, 10002, 10003, 20000];
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

    //
    // Products
    //
    const productGenerator = new ProductGenerator(
        entityGenerators,
        // [],
        // TEMPORARILY disable option generation.
        optionGenerators,
        world.ruleChecker
    );

    //
    // Prologues
    //
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

    //
    // Epilogues
    //
    const epilogues = [
        "I'm (done,fine,good)",
        "thank you",
        "thanks",
        "that's (all,everything,it)",
        "(that'll,that will,that should) (be,do) it",
        "bye",
    ];
    const epilogueGenerator = new AliasGenerator(epilogues);

    //
    // Orders
    //
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
        yield createTestCase(
            world.catalog,
            [orderGenerator.randomOrder(random)]
        );
    }
}


go();

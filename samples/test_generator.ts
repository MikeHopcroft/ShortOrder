import * as dotenv from 'dotenv';

import {
    AID,
    PID,
    MENUITEM,
    OPTION,
    TestCase,
    World,
} from 'prix-fixe';

import {
    AliasGenerator,
    AttributeGenerator,
    createTestCase,
    EITHER,
    EntityGenerator,
    fuzzerMain,
    LEFT,
    OptionGenerator,
    OrderGenerator,
    OrderX,
    Position,
    ProcessorFactory,
    ProductGenerator,
    QuantityX,
    Random,
    RemovalGenerator,
    RIGHT,
    TestCaseGeneratorFactory,
} from '../src';


async function go()
{
    dotenv.config();
    const testCaseGeneratorFactory = new TestCaseGeneratorFactory([
        {
            name: 'a',
            description: 'Level A: single product with quantifiers and attributes',
            factory: levelA,
        },
        {
            name: 'b',
            description: 'Level B: single product with quantifiers, attributes, and options',
            factory: levelB,
        },
        {
            name: 'c',
            description: 'Level C: multiple products with quantifiers, attributes, and options',
            factory: levelC,
        },
        {
            name: 'd',
            description: 'Level D: remove a single product by its generic name',
            factory: remove,
        }
    ]);

    // TODO: add your processors here to enable the "-v" test verification option.
    const processorFactory = new ProcessorFactory([]);

    // Run the fuzzer application.
    fuzzerMain(testCaseGeneratorFactory, processorFactory);
}

///////////////////////////////////////////////////////////////////////////////
//
// Configure generators
//
///////////////////////////////////////////////////////////////////////////////
interface ProductGenerators {
    prologueGenerator: AliasGenerator;
    productGenerator: ProductGenerator;
    epilogueGenerator: AliasGenerator;
}

interface RemoveGenerators {
    removePrologues: AliasGenerator;
    removeEpilogues: AliasGenerator;
}

function configureProductGenerators(
    world: World,
    generateOptions: boolean
): ProductGenerators {
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

    const entityBlackList = new Set<PID>([2122273]);
    const entityPIDs: PID[] = [];
    for (const entity of world.catalog.genericEntities()) {
        // Skip over items that don't have aliases.
        if (entity.aliases.length === 0 || entity.aliases[0].length === 0) {
            continue;
        }

        if (entity.kind !== MENUITEM) {
            continue;
        }

        if (entityBlackList.has(entity.pid)) {
            continue;
        }

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
        generateOptions ? optionGenerators : [],
        world.ruleChecker
    );

    //
    // Prologues
    //
    const prologues = [
        "[all right,alright,allrighty,ok,ok let's see,let's see,you got it,sure,sure not a problem,not a problem] (that's,that is,I'll add,I've added,I have added,I added,I have,we've got,we have)"
        // "(I'd,I would) like",
        // "(I'll,I will) (do,get,have,take)",
        // "I (need,want)",
        // "(get,give) me",
        // "(can,could,may) I [just,please] (do,get,have)",
        // "[please] set me up with",
        // "[please] hook me up with",
        // "we need",
        // "we want",
        // "(we'd,we would) like",
        // "(we'll, we will) have",
        // "how about",
    ];
    const prologueGenerator = new AliasGenerator(prologues);

    //
    // Epilogues
    //
    const epilogues = [
        "(anything else for, is that all for, is there anything else for) (you, ya) [this morning, this afternoon, this evening, today]",
        "what else (are we getting, can I get for you) [this morning, this afternoon, this evening, today]",
        "is that everything (for you, for ya) [this morning, this afternoon, this evening, today]",
        "(is that everything, is that all, anything else, is there anything else) [for you, for ya]",
        // "I'm (done,fine,good)",
        // "thank you",
        // "thanks",
        // "that's (all,everything,it)",
        // "(that'll,that will,that should) (be,do) it",
        // "bye",
    ];
    const epilogueGenerator = new AliasGenerator(epilogues);

    return {
        prologueGenerator,
        productGenerator,
        epilogueGenerator
    };
}

function *levelA(world: World) {
    yield *generateOrders(world, 1, false);
}

function *levelB(world: World) {
    yield *generateOrders(world, 1, true);
}

function *levelC(world: World) {
    yield *generateOrders(world, 3, true);
}

function* generateOrders(
    world: World,
    maxSegmentCount: number,
    generateOptions: boolean
): IterableIterator<TestCase> {
    const {prologueGenerator, productGenerator, epilogueGenerator} =
        configureProductGenerators(world, generateOptions);

    //
    // Orders
    //
    const orderGenerator = new OrderGenerator(
        prologueGenerator,
        productGenerator,
        maxSegmentCount,
        epilogueGenerator
    );

    const random = new Random("1234");

    while (true) {
        yield createTestCase(
            world.catalog,
            [orderGenerator.randomOrder(random)]
        );
    }
}

function* remove(
    world: World
): IterableIterator<TestCase> {
    const generateOptions = true;
    const {prologueGenerator, productGenerator, epilogueGenerator} =
        configureProductGenerators(world, generateOptions);

    //
    // Remove Prologues
    //
    const removePrologues = [
        "[no problem,sure thing,yeah,great,allrighty,ok,alright] [so] (i've,i have,i will,we've) (take off,remove) (the,that)"
        // "(can,could,would) you [please] remove the",
        // "[please] remove the",
        // "I (don't,do not) (want,need) the",
        // "(lose,remove) the"
    ];
    const removePrologueGenerator = new AliasGenerator(removePrologues);

    //
    // Remove Epilogues
    //
    const removeEpilogues = [
        "(anything else for, is that all for, is there anything else for) (you, ya) [this morning, this afternoon, this evening, today]",
        "what else (are we getting, can I get for you) [this morning, this afternoon, this evening, today]",
        "is that everything (for you, for ya) [this morning, this afternoon, this evening, today]",
        "(is that everything, is that all, anything else, is there anything else) [for you, for ya]",
        // "I'm (done,fine,good)",
        // "thank you",
        // "thanks",
        // "that's (all,everything,it)",
        // "(that'll,that will,that should) (be,do) it",
        // "bye",
    ];
    const removeEpilogueGenerator = new AliasGenerator(removeEpilogues);

    const removalGenerator = new RemovalGenerator(
        prologueGenerator,
        productGenerator,
        epilogueGenerator,
        2,
        removePrologueGenerator,
        removeEpilogueGenerator
    );

    const random = new Random("1234");

    while (true) {
        yield createTestCase(
            world.catalog,
            removalGenerator.randomGenericEntityRemoval(random)
        );
    }
}


go();

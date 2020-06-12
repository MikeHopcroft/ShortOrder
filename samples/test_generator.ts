import * as dotenv from 'dotenv';

import {
    AID,
    GenericCase,
    PID,
    MENUITEM,
    OPTION,
    TestCase,
    TextTurn,
    ValidationStep,
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
        // {
        //     name: 'd',
        //     description: 'Level D: remove a single product by its generic name',
        //     factory: remove,
        // }
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
const prologues = [
    "(hi,hello,howdy) [there]",
    "(all right,ok,okay,yes,yeah,let's see) [so]",
    "(ah,um)",
    "",
];

const epilogues = [
    "I'm (done,good,ready)",
    "thank you",
    "thanks",
    "that's (all,everything,it)",
    "(that'll,that will,that should) (be,do) (all,everything,it)",
    "bye",
    "okay",
    "how much is that",
    "",
];

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
    optionCountRange: [number, number]
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

    const entityBlackList = new Set<PID>([]);
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
            world.ruleChecker,
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
        optionGenerators,
        optionCountRange,
        world.ruleChecker
    );

    //
    // Prologues
    //
    const adds = [
        "(I'd,I would) [also] like",
        "(I'll,I will) [also] (do,get,have,take)",
        "I (need,wanna,want)",
        "(get,give) me",
        "(can,could,may) (I,we,you) [just,please] [also] (do,get,have)",
        "[please] set me up with",
        "[please] hook me up with",
        "we need",
        "we want",
        "(we'd,we would) [also] like",
        "(we'll, we will) [also] have",
        "how about",
        "[please,also] add",
      ];
    const prologueGenerator = new AliasGenerator([prologues, adds]);

    //
    // Epilogues
    //
    const epilogueGenerator = new AliasGenerator([epilogues]);

    return {
        prologueGenerator,
        productGenerator,
        epilogueGenerator
    };
}

function *levelA(world: World) {
    yield *generateOrders(world, [1, 1], [0, 0]);
}

function *levelB(world: World) {
    yield *generateOrders(world, [1, 1], [1, 3]);
}

function *levelC(world: World) {
    yield *generateOrders(world, [1, 3], [1, 3]);
}

function* generateOrders(
    world: World,
    segmentCountRange: [number, number],
    optionCount: [number, number]
): IterableIterator<GenericCase<ValidationStep<TextTurn>>> {
// ): IterableIterator<TestCase> {
    const {prologueGenerator, productGenerator, epilogueGenerator} =
        configureProductGenerators(world, optionCount);

    //
    // Orders
    //
    const orderGenerator = new OrderGenerator(
        prologueGenerator,
        productGenerator,
        segmentCountRange,
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

// function* remove(
//     world: World
// ): IterableIterator<TestCase> {
//     const optionCountRange: [number, number] = [1, 3];
//     const {prologueGenerator, productGenerator, epilogueGenerator} =
//         configureProductGenerators(world, optionCountRange);

//     //
//     // Remove Prologues
//     //
//     const removes = [
//         "[can we,can you,would you,i want to,i'd like to,please] (cancel,delete,drop,eighty six,lose,remove,removed,skip,take off,take away) [the]",
//     ];
//     const removePrologueGenerator = new AliasGenerator([prologues, removes]);

//     //
//     // Remove Epilogues
//     //
//     const removeEpilogueGenerator = new AliasGenerator([epilogues]);

//     const removalGenerator = new RemovalGenerator(
//         prologueGenerator,
//         productGenerator,
//         epilogueGenerator,
//         2,
//         removePrologueGenerator,
//         removeEpilogueGenerator
//     );

//     const random = new Random("1234");

//     while (true) {
//         yield createTestCase(
//             world.catalog,
//             removalGenerator.randomGenericEntityRemoval(random)
//         );
//     }
// }


go();

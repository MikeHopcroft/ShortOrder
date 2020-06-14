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
    Quantifiers,
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
    "(I'm,I am,we're,we are) (done,good)",
    "(I'm,I am,we're,we are) ready to (pay, check out)",
    "thank you",
    "thanks",
    "that's (all,everything,it)",
    "(that'll,that will,that should) (be) (all,everything)",
    "(that'll,that will,that should) (do) (it)",
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
    const positions = new Map<string, Position>([
        ['coffee_size', LEFT],
        ['espresso_size', LEFT],
        ['option_quantity', LEFT],
    ]);

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

        // // TEMPORARY code to restrict fuzzer to products
        // // with 'latte' in their names.
        // if (entity.name.indexOf('latte') !== -1) {
        //     entityPIDs.push(entity.pid);
        // }
        entityPIDs.push(entity.pid);
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
    // TODO: consider putting the option position hints into
    // the menu as annotations.
    //
    const quantifiers = new Map<
        string,
        {left: QuantityX[], right: QuantityX[]}
    >([
        [
            'dash',
            {
                left: [
                    new QuantityX(1, 'one dash'),
                    new QuantityX(1, 'one sprinkle'),
                    new QuantityX(1, 'two dashes'),
                    new QuantityX(1, 'two sprinkles'),
                    new QuantityX(1, 'three dashes'),
                    new QuantityX(1, 'three sprinkles'),
                ],
                right: [
                    new QuantityX(1, 'a bit of'),
                    new QuantityX(1, 'some'),
                    new QuantityX(1, 'a dash of'),
                    new QuantityX(1, 'one dash of'),
                    new QuantityX(2, 'two dashes of'),
                    new QuantityX(3, 'three dashes of'),            
                    new QuantityX(1, 'a sprinkle of'),
                    new QuantityX(1, 'one sprinkle of'),
                    new QuantityX(2, 'two sprinkles of'),
                    new QuantityX(3, 'three sprinkles of'),            
                ],
            }
        ],
        [
            'default',
            {
                left: [
                    new QuantityX(1, ''),
                ],
                right: [
                    new QuantityX(1, ''),
                ],
            }
        ],
        [
            'extra',
            {
                left: [
                    new QuantityX(1, 'a'),
                    new QuantityX(1, 'an extra'),
                    new QuantityX(1, 'an added'),
                    new QuantityX(2, 'two'),
                    new QuantityX(2, 'two extra'),
                    new QuantityX(2, 'two added'),
                    new QuantityX(3, 'three extra'),
                    new QuantityX(3, 'three added'),
                ],
                right: [
                    new QuantityX(1, 'a'),
                    new QuantityX(1, 'an extra'),
                    new QuantityX(1, 'an added'),
                    new QuantityX(2, 'two'),
                    new QuantityX(2, 'two extra'),
                    new QuantityX(2, 'two added'),
                    new QuantityX(3, 'three extra'),
                    new QuantityX(3, 'three added'),
                ],
            }
        ],
        [
            'packet',
            {
                left: [
                    new QuantityX(1, 'one'),
                    new QuantityX(2, 'two'),
                    new QuantityX(3, 'three'),
                ],
                right: [
                    new QuantityX(1, 'some'),
                    new QuantityX(1, 'a packet of'),
                    new QuantityX(1, 'one packet of'),
                    new QuantityX(2, 'two packets of'),
                    new QuantityX(3, 'three packets of'),
                    new QuantityX(1, 'a pack of'),
                    new QuantityX(1, 'one pack of'),
                    new QuantityX(2, 'two packs of'),
                    new QuantityX(3, 'three packs of'),
                    new QuantityX(1, 'a package of'),
                    new QuantityX(1, 'one package of'),
                    new QuantityX(2, 'two packages of'),
                    new QuantityX(3, 'three packages of'),
                ],
            }
        ],
        [
            'pump',
            {
                left: [
                    new QuantityX(1, ''),
                    new QuantityX(1, 'one pump'),
                    new QuantityX(2, 'two pump'),
                    new QuantityX(3, 'three pump'),
                    new QuantityX(1, 'one squirt'),
                    new QuantityX(2, 'two squirt'),
                    new QuantityX(3, 'three squirt'),
                ],
                right: [
                    new QuantityX(1, 'some'),
                    new QuantityX(1, 'a pump of'),
                    new QuantityX(1, 'one pump of'),
                    new QuantityX(2, 'two pumps of'),
                    new QuantityX(3, 'three pumps of'),
                    new QuantityX(1, 'a squirt of'),
                    new QuantityX(1, 'one squirt of'),
                    new QuantityX(2, 'two squirts of'),
                    new QuantityX(3, 'three squirts of'),
                ],
            }
        ],
        [
            'splash',
            {
                left: [
                    new QuantityX(1, 'one'),
                    new QuantityX(2, 'two'),
                    new QuantityX(3, 'three'),
                ],
                right: [
                    new QuantityX(1, 'a splash of'),
                    new QuantityX(1, 'some'),
                    new QuantityX(1, 'one splash of'),
                    new QuantityX(2, 'two splashes of'),
                    new QuantityX(3, 'three splashes of'),
                ],
            }
        ],
    ]);

    // TODO: consider getting these from menu annotations.
    const optionPositions = new Map<string, Position>([
        ['foam', RIGHT],
        ['ice', RIGHT],
        ['whipped cream', RIGHT],
        ['water', RIGHT],
        ['for here cup', RIGHT],
        ['lid', RIGHT],
        ['with room', RIGHT],
        ['to go', RIGHT],
        ['equal', RIGHT],
        ['honey', RIGHT],
        ['splenda', RIGHT],
        ['sugar', RIGHT],
        ['sugar in the raw', RIGHT],
        ['sweet n low', RIGHT],
        ['espresso shot', RIGHT],
        ['butter', RIGHT],
        ['strawberry jam', RIGHT],
        ['warmed', RIGHT],
        ['cut in half', RIGHT],
        ['whole milk creamer', RIGHT],
        ['two percent milk creamer', RIGHT],
        ['one percent milk creamer', RIGHT],
        ['nonfat milk creamer', RIGHT],
        ['coconut milk creamer', RIGHT],
        ['soy milk creamer', RIGHT],
        ['almond milk creamer', RIGHT],
        ['oat milk creamer', RIGHT],
        ['eggnog creamer', RIGHT],
        ['half and half', RIGHT],
        ['heavy cream', RIGHT],
    ]);
    const optionPositionPredicate = (name: string): Position => {
        return optionPositions.get(name) || EITHER;
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
            quantifiers
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
    // TODO: consider getting these from the lexicon.
    const adds = [
        "(I'd,I would) [also] like",
        "(I'll,I will) [also] (do,get,have,take)",
        "I (need,wanna,want)",
        "(get,give) me",
        "(can,could,may) (I,we,you) [just,please] [also] (do,get,get me,get us,have)",
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

function *levelA(world: World, random: Random) {
    yield *generateOrders(world, random, [1, 1], [0, 0]);
}

function *levelB(world: World, random: Random) {
    yield *generateOrders(world, random, [1, 1], [1, 3]);
}

function *levelC(world: World, random: Random) {
    yield *generateOrders(world, random, [1, 3], [1, 3]);
}

function* generateOrders(
    world: World,
    random: Random,
    segmentCountRange: [number, number],
    optionCount: [number, number]
): IterableIterator<GenericCase<ValidationStep<TextTurn>>> {
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

    while (true) {
        yield createTestCase(
            world.catalog,
            [orderGenerator.randomOrder(random)]
        );
    }
}

// function* remove(
//     world: World,
//     random: Random
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

// //     const random = new Random("1234");

//     while (true) {
//         yield createTestCase(
//             world.catalog,
//             removalGenerator.randomGenericEntityRemoval(random)
//         );
//     }
// }


go();

import * as yaml from 'js-yaml';
import * as path from 'path';

import {
    AID,
    setup,
} from 'prix-fixe';

import { createProcessor } from '../src';

import {
    AliasGenerator,
    AttributeGenerator,
    EITHER,
    EntityGenerator,
    OptionGenerator,
    OrderGenerator,
    Position,
    ProductGenerator,
    ProductX,
    LEFT,
    OptionX,
    QuantityX,
    RIGHT,
    Random,
    runTests,
    OrderX,
    WordX
} from '../src/fuzzer3';

async function go()
{
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

    ///////////////////////////////////////////////////////////////////////////
    //
    // Configure generators
    //
    ///////////////////////////////////////////////////////////////////////////
    // TODO: These should map DID to Position.
    const positions = new Map<AID, Position>();
    positions.set(1, LEFT);
    positions.set(2, LEFT);
    positions.set(3, LEFT);

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
    const entityGenerator = new EntityGenerator(
        world.attributeInfo,
        attributes,
        world.catalog,
        9000,
        entityQuantities
    );

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

    const optionGenerator = new OptionGenerator(
        world.attributeInfo,
        attributes,
        world.catalog,
        5000,
        optionPositionPredicate,
        optionLeftQuantites,
        optionRightQuantites,
    );

    const productGenerator = new ProductGenerator(
        [entityGenerator],
        [optionGenerator]
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
        "I'm (done,fine,good,ready)",
        "thank you",
        "thanks",
        "that's (all,everything,it)",
        "(that'll,that will,that should) (be,do) it",
        "bye",
    ];
    const epilogueGenerator = new AliasGenerator(epilogues);

    const maxSegmentCount = 3;
    const orderGenerator = new OrderGenerator(
        prologueGenerator,
        productGenerator,
        maxSegmentCount,
        epilogueGenerator
    );

    const random = new Random("1234");

    function* orders(): IterableIterator<OrderX> {
        for (let i = 0; i < 5; ++i) {
            yield orderGenerator.randomOrder(random);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Run tests as they are generated.
    //
    ///////////////////////////////////////////////////////////////////////////
    const results = await runTests(orders(), world.catalog, processor);
    results.print(true);

    // ///////////////////////////////////////////////////////////////////////////
    // //
    // // Output generated cases
    // //
    // ///////////////////////////////////////////////////////////////////////////
    // const yamlCases = results.rebase();
    // for (const yamlCase of yamlCases) {
    //     yamlCase.suites = 'synthetic';
    // }
    // const yamlText = yaml.safeDump(yamlCases, { noRefs: true });
    // console.log(yamlText);
}

go();

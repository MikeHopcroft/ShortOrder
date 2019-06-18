import * as path from 'path';

import {
    AID,
    setup,
} from 'prix-fixe';

import { createProcessor } from '../src';

import {
    AttributeGenerator,
    EITHER,
    EntityGenerator,
    OptionGenerator,
    Position,
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

    //
    // Options
    //
    // const fivePumps = new QuantityX(5, 'five pump');
    // const aPump = new QuantityX(1, 'a pump of');
    // const a = new QuantityX(1, 'a');

    // const extra = new AttributeX(5, 'extra', LEFT);

    // const options: OptionX[] = [
    //     new QuantifiedOptionX(fivePumps, '12:1', 'cinnamon dolce syrup', LEFT),
    //     new QuantifiedOptionX(a, '120:1', 'lid', RIGHT),
    //     new AttributedOptionX(extra, '14:2', 'vanilla syrup', EITHER),
    // ];

    const optionQuantites: QuantityX[] = [
        new QuantityX(1, 'one pump of'),
        new QuantityX(2, 'two pumps of'),
    ];
    const optionGenerator = new OptionGenerator(
        world.attributeInfo,
        attributes,
        world.catalog,
        5000,
        optionQuantites
    );

    const random = new Random("1234");

    function* orders(): IterableIterator<OrderX> {
        for (let i = 0; i < 5; ++i) {
            const entity = entityGenerator.randomEntity(random);
            const options: OptionX[] = [
                optionGenerator.randomAttributedOption(random),
                // optionGenerator.randomQuantifiedOption(random),
            ];
            const product = new ProductX(
                entity.quantity,
                entity.attributes,
                options,
                entity.key,
                entity.text
            );
            const segment = product.randomSegment(random);
            yield new OrderX([segment, new WordX('and'), segment]);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Run tests as they are generated.
    //
    ///////////////////////////////////////////////////////////////////////////
    const results = await runTests(orders(), world.catalog, processor);
    results.print(true);
}

go();

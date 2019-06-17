import * as path from 'path';

import {
    AID,
    setup,
    State,
    World
} from 'prix-fixe';

import { LexicalAnalyzer, tokenToString } from '../src';

import { Parser2, SequenceToken } from '../src/parser2';

import {
    AttributeGenerator,
    AttributeX,
    AttributedOptionX,
    createTestCase,
    EITHER,
    EntityGenerator,
    OptionGenerator,
    Position,
    ProductX,
    LEFT,
    OptionX,
    QuantifiedOptionX,
    QuantityX,
    RIGHT,
    Random,
    testOrdersIdentical
} from '../src/fuzzer3';

function go() {
    const quantity = new QuantityX(1, 'a');

    const attributes: AttributeX[] = [
        new AttributeX(1, 'grande', LEFT),
        new AttributeX(2, 'decaf', EITHER),
        new AttributeX(2, 'iced', EITHER),
    ];

    const fivePumps = new QuantityX(5, 'five pump');
    const aPump = new QuantityX(1, 'a pump of');
    const a = new QuantityX(1, 'a');

    const extra = new AttributeX(5, 'extra', LEFT);

    const options: OptionX[] = [
        new QuantifiedOptionX(fivePumps, '12:1', 'cinnamon dolce syrup', LEFT),
        new QuantifiedOptionX(a, '120:1', 'lid', RIGHT),
        new AttributedOptionX(extra, '14:2', 'vanilla syrup', EITHER),
    ];

    const entity = new ProductX(
        quantity,
        attributes,
        options,
        '9000:0:0:1',
        'latte'
    );

    const random = new Random("1234");

    for (let i = 0; i < 10; ++i) {
        const segment = entity.randomSegment(random);
        const text = segment.buildText().join(' ');
        console.log(text);
    } 
}

async function go2()
{
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
        // console.log(tokens.map(tokenToString).join(''));

        const interpretation = parser.findBestInterpretation(tokens as SequenceToken[]);

        let updated = state.cart;
        for (const item of interpretation.items) {
            updated = world.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };


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


    //
    // Generation loop
    //
    const random = new Random("1234");

    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < 50; ++i) {
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
        const text = segment.buildText().join(' ');
        console.log(text);

        const testCase = createTestCase(
            world.catalog,
            world.attributeInfo,
            segment
        );

        const result = await testCase.run(processor, world.catalog);
        // console.log(`Test status: ${result.passed?"PASSED":"FAILED"}`);

        const ok = testOrdersIdentical(testCase.expected[0], result.observed[0]);
        console.log(`Test status: ${ok ? "PASSED" : "FAILED"}`);
        if (ok) {
            passedCount++;
        }
        else {
            failedCount++;
        }
        console.log('');
    }

    console.log('');
    console.log(`failed: ${failedCount}`);
    console.log(`passed: ${passedCount}`);
    console.log(`fraction: ${passedCount}/${passedCount + failedCount}`);
}

go2();

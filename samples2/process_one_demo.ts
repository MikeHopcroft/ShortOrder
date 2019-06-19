import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { Result, setup, State, TestCase, TestLineItem, TestOrder } from 'prix-fixe';

import { createProcessor } from '../src';

export class OrderOps {
    // TODO: does this convenience method really belong here?
    static printOrder(order: TestOrder) {
        console.log(OrderOps.formatOrder(order));
    }

    static formatOrder(order: TestOrder) {
        return order.lines.map(OrderOps.formatLineItem).join('\n');
    }

    static formatLineItem(item: TestLineItem) {
        const leftFieldWidth = 4 + item.indent * 2;
        const left = rightJustify(item.quantity + ' ', leftFieldWidth);

        const rightFieldWidth = 10;  // Prices up to 999.99
        let right = '';
        right = rightJustify(item.key, rightFieldWidth);

        const totalWidth = 50;
        const middleWidth = 
            Math.max(0, totalWidth - left.length - right.length);
        const middle = leftJustify(item.name + ' ', middleWidth);

        return `${left}${middle}${right}`;
    }
}

function leftJustify(text: string, width: number) {
    if (text.length >= width) {
        return text;
    }
    else {
        const paddingWidth = width - text.length;
        const padding = new Array(paddingWidth + 1).join(' ');
        return text + padding;
    }
}

function rightJustify(text: string, width: number) {
    if (text.length >= width) {
        return text;
    }
    else {
        const paddingWidth = width - text.length;
        const padding = new Array(paddingWidth + 1).join(' ');
        return padding + text;
    }
}

// function printResult(result: Result) {
//     for (const order of result.observed) {
//         for (const line of order.lines) {
//             line.
//         }
//     }
// }

async function go(utterance: string) {
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

    // let state: State = {
    //     cart: {
    //         items: [],
    //     }
    // };

    // state = await processor(utterance, state);
    const testCase = new TestCase(
        0,
        'priority',
        ['suites'],
        'comment',
        [utterance],
        [
            {
                lines: [],
            }
        ]
    );

    const result = await testCase.run(processor, world.catalog);

    OrderOps.printOrder(result.observed[0]);
}

// go('soy latte');

// go("two large soy lattes iced");
// go("we would like two large iced soy milk lattes and one decaffeinated iced medium soy milk latte I'm ready");
// go("we will have one soy medium decaf latte iced two small lattes with soy and three large iced soy lattes thank you");
// go("can I just have one medium soy milk latte half caf I'm fine");

// This one fails because it takes "two zero percent milk" as a quantified attribute of the second
// entity because it is the second milk. Should have taken "two" as an entity quantifier.
// Also it takes "two zero percent milk", even though milk should not be quantified.
//go("may I do one small iced soy latte half caf and two zero percent milk small caffe mochas that will do it");
go("one soy latte half caf and two zero percent milk lattes");

// Problem is again with "one two percent milk". Quantifier "one" associates with "two percent milk" instead of cappuccino.
// Would work if we required units. Would work if we enforced rule against quantifiers for milk.
// go("may I please do a large mocha with whole milk split shot one two percent milk large cappuccino and one medium caffe latte with whole milk that's all");

// Truely ambiguous? Can split before or after "half caf". Conjunction "and" needs stronger signal. Quantifier "three" cannot modify soy.
// go("we need one medium two percent milk mocha iced half caf and three soy iced medium cappuccinos bye");



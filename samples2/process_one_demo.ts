import * as path from 'path';
import { setup, TestCase, TestLineItem, TestOrder } from 'prix-fixe';

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

        const rightFieldWidth = 10;
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

async function go(utterance: string) {
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

    console.log(`UTTERANCE: "${utterance}"`);
    console.log(' ');
    console.log('Cart');

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
// STILL BROKEN
// go("may I do one small iced soy latte half caf and two zero percent milk small caffe mochas that will do it");
// go("one soy latte half caf and two zero percent milk lattes");
// go("one soy latte half caf and two soy lattes");

// Problem is again with "one two percent milk". Quantifier "one" associates with "two percent milk" instead of cappuccino.
// Would work if we required units. Would work if we enforced rule against quantifiers for milk.
// go("may I please do a large mocha with whole milk split shot one two percent milk large cappuccino and one medium caffe latte with whole milk that's all");

// Truely ambiguous? Can split before or after "half caf". Conjunction "and" needs stronger signal. Quantifier "three" cannot modify soy.
// go("we need one medium two percent milk mocha iced half caf and three soy iced medium cappuccinos bye");

// This seems to segment incorrectly because mutual exclusion is not enforced for whole milk and two percent milk
// go("I'll get three dopio caffe espressos with whole milk decaf a large mocha with whole milk split shot and one two percent milk large cappuccino that's all");
//
// I'll get three dopio caffe espressos with whole milk decaf
// a large mocha with whole milk
// split shot and one two percent milk large cappuccino that's all"
//
//     "0/3/medium decaf espresso/9500:1:2" === "0/3/medium decaf espresso/9500:1:2" - OK
//     "1/1/whole milk/5000" === "1/1/whole milk/5000" - OK
//     "0/1/large halfcaf mocha/9200:0:2:1" !== "0/1/large mocha/9200:0:2:0" - <=== ERROR
//     "1/1/whole milk/5000" !== "0/1/large halfcaf cappuccino/9100:0:2:1" - <=== ERROR
//     "0/1/large cappuccino/9100:0:2:0" !== "1/1/whole milk/5000" - <=== ERROR
//     "1/1/two percent milk/5001" === "1/1/two percent milk/5001" - OK
//
// UTTERANCE: "I'll get three dopio caffe espressos with whole milk decaf a large mocha with whole milk split shot and one two percent milk large cappuccino that's all"
 
// Cart
//   3 medium decaf espresso                 9500:1:2
//     1 whole milk                              5000
//   1 large mocha                         9200:0:2:0
//   1 large halfcaf cappuccino            9100:0:2:1
//     1 whole milk                              5000
//     1 two percent milk                        5001

go("may I do one small iced soy latte half caf and two zero percent milk single caffe espressos that will do it");
// Utterance 0: "may I do one small iced soy latte half caf and two zero percent milk single caffe espressos that will do it"
//     "0/1/small halfcaf iced latte/9000:1:0:1" !== "0/1/small iced latte/9000:1:0:0" - <=== ERROR
//     "1/1/soy milk/5003" === "1/1/soy milk/5003" - OK
//     "0/2/single espresso/9500:0:0" !== "0/1/small halfcaf espresso/9500:0:1" - <=== ERROR
//     "1/1/fat free milk/5002" !== "1/2/fat free milk/5002" - <=== ERROR

// UTTERANCE: "may I do one small iced soy latte half caf and two zero percent milk single caffe espressos that will do it"
 
// Cart
//   1 small iced latte                    9000:1:0:0
//     1 soy milk                                5003
//   1 small halfcaf espresso                9500:0:1
//     2 fat free milk                           5002
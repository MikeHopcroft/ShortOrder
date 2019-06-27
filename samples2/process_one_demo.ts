import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';
import { TestCase, TestLineItem, TestOrder } from 'prix-fixe';

import { createShortOrderProcessor, createWorld } from '../src';

dotenv.config();

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

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Process one query');
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-h|help|?]`);
    console.log('');
    console.log('-d datapath     Path to prix-fixe data files.');
    console.log('                    attributes.yaml');
    console.log('                    intents.yaml');
    console.log('                    options.yaml');
    console.log('                    products.yaml');
    console.log('                    quantifiers.yaml');
    console.log('                    rules.yaml');
    console.log('                    stopwords.yaml');
    console.log('                    units.yaml');
    console.log('                The -d flag overrides the value specified');
    console.log('                in the PRIX_FIXE_DATA environment variable.');
    console.log('-h|help|?       Show this message.');
    console.log(' ');
}

async function go(utterance: string) {
    const args = minimist(process.argv.slice());

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }

    if (args.h || args.help || args['?']) {
        showUsage();
        return;
    }

    if (dataPath === undefined) {
        const message = 'PRIX_FIXE_DATA environment variable must be set to data path';
        throw TypeError(dataPath);
    }

    const world = createWorld(dataPath);
    const processor = createShortOrderProcessor(world, dataPath);

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

// FIXED: 8bbd7455725c405b11a0df109c06537daf4f7ede
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

// go("may I do one small iced soy latte half caf and two zero percent milk single caffe espressos that will do it");
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

// go("may I just do an iced small cappuccino decaffeinated and three medium decaffeinated caffe lattes that's everything");
// Utterance 0: "may I just do an iced small cappuccino decaffeinated and three medium decaffeinated caffe lattes that's everything"
//     "0/1/small decaf iced cappuccino/9100:1:0:2" !== "0/1/small decaf cappuccino/9100:0:0:2" - <=== ERROR
//     "0/3/medium decaf latte/9000:0:1:2" === "0/3/medium decaf latte/9000:0:1:2" - OK

// FIXED in 470bf5b5ebd8429a1759f54544600067f01bba31
// "I will take 
//  one small latte with notfat milk 
//  two iced small cappuccinos with zero percent
//  and 
//  an iced large mocha decaf with soy milk that's it"
// 152 - FAILED
//   Comment: synthetic
//   Suites: unverified
//   Utterance 0: "I will take one small latte with notfat milk two iced small cappuccinos with zero percent and an iced large mocha decaf with soy milk that's it"
//     "0/1/small latte/9000:0:0:0" === "0/1/small latte/9000:0:0:0" - OK
//     "1/1/fat free milk/5002" === "1/1/fat free milk/5002" - OK
//     "0/2/small iced cappuccino/9100:1:0:0" === "0/2/small iced cappuccino/9100:1:0:0" - OK
//     "1/1/fat free milk/5002" !== "0/1/large decaf iced mocha/9200:1:2:2" - <=== ERROR
//     "0/1/large decaf iced mocha/9200:1:2:2" !== "1/1/fat free milk/5002" - <=== ERROR
//     "1/1/soy milk/5003" === "1/1/soy milk/5003" - OK
// go("I will take one small latte with notfat milk two iced small cappuccinos with zero percent and an iced large mocha decaf with soy milk that's it");

// FIXED in 470bf5b5ebd8429a1759f54544600067f01bba31
// 347 - FAILED
//   Comment: synthetic
//   Suites: unverified
//   Utterance 0: "could I please have one small latte with zero percent milk an iced medium caffe mocha with whole milk split shot and three medium iced cappuccinos with whole milk that's it"
//     "0/1/small latte/9000:0:0:0" === "0/1/small latte/9000:0:0:0" - OK
//     "1/1/fat free milk/5002" !== "0/1/medium halfcaf iced mocha/9200:1:1:1" - <=== ERROR
//     "0/1/medium halfcaf iced mocha/9200:1:1:1" !== "1/1/fat free milk/5002" - <=== ERROR
//     "1/1/whole milk/5000" === "1/1/whole milk/5000" - OK
//     "0/3/medium iced cappuccino/9100:1:1:0" === "0/3/medium iced cappuccino/9100:1:1:0" - OK
//     "1/1/whole milk/5000" === "1/1/whole milk/5000" - OK

// FIXED in 470bf5b5ebd8429a1759f54544600067f01bba31
// 387 - FAILED
//   Comment: synthetic
//   Suites: unverified
//   Utterance 0: "hook me up with a medium caffe latte iced with zero percent milk and a large mocha with soy milk that's everything"
//     "0/1/medium iced latte/9000:1:1:0" === "0/1/medium iced latte/9000:1:1:0" - OK
//     "1/1/fat free milk/5002" !== "0/1/large mocha/9200:0:2:0" - <=== ERROR
//     "0/1/large mocha/9200:0:2:0" !== "1/1/fat free milk/5002" - <=== ERROR
//     "1/1/soy milk/5003" === "1/1/soy milk/5003" - OK

// ENABLED in 167c91170f6bdf5fdf03b7dbe795ee6ea1d7e0a8
// go("three two pump hazelnut latte with five pumps caramel and ristretto");

// go("could I please get three dopio split shot skinny caffe espressos three medium cappuccinos with a pump of caramel and a large three pump whole milk mocha I'm fine");
// "could I please get 
// three dopio split shot skinny caffe espressos
// three medium cappuccinos with a pump of caramel
// and
// a large three pump whole milk mocha
// I'm fine"

// Utterance 0: "could I please get three dopio split shot skinny caffe espressos three medium cappuccinos with a pump of caramel and a large three pump whole milk mocha I'm fine"
// "0/3/medium halfcaf espresso/9500:1:1" === "0/3/medium halfcaf espresso/9500:1:1" - OK
// "1/1/fat free milk/5002" === "1/1/fat free milk/5002" - OK
// "0/3/medium cappuccino/9100:0:1:0" === "0/3/medium cappuccino/9100:0:1:0" - OK
// "1/1/caramel syrup/10000" !== "0/1/large mocha/9200:0:2:0" - <=== ERROR
// "0/1/large mocha/9200:0:2:0" !== "1/1/caramel syrup/10000" - <=== ERROR
// "1/3/whole milk/5000" === "1/3/whole milk/5000" - OK

// go("may I please have a regular cookie crumble topping hot tall one third decaf berry sangria syrup cinnamon dolce latte bye");

// Fuzzer violated mutual exclusion on caffeine
//go("I will take an iced two thirds decaf one third decaf upside down latte macchiato grande that'll do it");

// go("could I do three iced sixteen ounce no pumpkin spice topping earl grey tea lattes with extra vanilla syrup sugar free and a pump of vanilla powder thank you");
go("can I please get two iced regularx two pump hazelnut syrup sugar free three pump sugar nitro lattes with regular hazelnut drizzle thank you");
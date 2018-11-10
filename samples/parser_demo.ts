import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { Catalog, CatalogItems, validateCatalogItems, ConvertDollarsToPennies } from '../src';
import { Cart, CartOps, Parser, Pipeline } from '../src';


function go(infile: string, utterances: string[]) {
    const catalogItems = yaml.safeLoad(fs.readFileSync(infile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);
    
    const ops = new CartOps(catalog);

    const debugMode = false;
    const pipeline = new Pipeline(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        undefined,
        debugMode);


    const parser = new Parser(catalog, pipeline);
    
    let cart: Cart = { items: [
    ]};

    for (const utterance of utterances) {
        console.log('-----------------------------------------');

        console.log(`"${utterance}":`);
        console.log();
        
        cart = parser.parse(utterance, cart);
        ops.printCart(cart);
        console.log();

        const missingChoices = ops.missingChoicesInCart(cart);
        for (const missing of missingChoices) {
            console.log(missing);
        }
        console.log();
    }
}

const utterances = [
    'can I get a cheeseburger well done with no pickles double onion double lettuce and a coffee two cream two sugar',
    'also get me a hamburger with swiss',
    'lose the cheeseburger and get me a couple pet chicken',
    "i'll also take a surf n turf",
    "make that with a small diet coke"

    // NOT IMPLEMENTED
    // "replace the small diet coke with a small coke"

    // FAILS: because of the word 'of' between 'couple' and 'pet'
    // 'lose the cheeseburger and get me a couple of pet chicken',


    // FAILS: just adds default onion and lettuce because extra corresponds to 1.
    // 'cheeseburger no pickles extra onion extra lettuce and well done'

    // FIXED: This one enters infinite loop at misspelled 'lettue'.
    // Risk is that random, unexpected terms might be able to trigger this behavior.
    // Also, should not be brittle in face of new tokens.
    // 'cheeseburger no pickles extra onion extra lettue and well done'
    // 'cheeseburger extra lettue and well done'
];

go('./samples/data/restaurant-en/menu2.yaml', utterances);

console.log('done');

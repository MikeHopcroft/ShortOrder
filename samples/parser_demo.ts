import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { Catalog, CatalogItems, validateCatalogItems, ConvertDollarsToPennies } from '../src';
import { actionToString, AnyAction, CartOps, Parser, Pipeline, responses, State } from '../src';


function go(infile: string, utterances: string[], debugMode: boolean) {
    const catalogItems = yaml.safeLoad(fs.readFileSync(infile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);
    
    const ops = new CartOps(catalog);

    const pipeline = new Pipeline(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        undefined,
        debugMode);


    const parser = new Parser(catalog, pipeline, debugMode);
    
    let state: State = { cart: { items: [] }, actions: [] };

    console.log('-----------------------------------------');
    console.log();
    console.log("SHORT-ORDER: \"Welcome to Mike's American Grill. What can I get started for you?\"");
    console.log();

    for (const utterance of utterances) {
        console.log('-----------------------------------------');

        console.log(`CUSTOMER: "${utterance}":`);
        console.log();
        
        state = parser.parse(utterance, state);
        ops.printCart(state.cart);
        console.log();

        state = ops.missingChoicesInCart(state);

        if (debugMode) {
            for (const action of state.actions) {
                console.log(`ACTION: ${actionToString(action as AnyAction)}`);
            }
        }

        const order = ops.formatCart(state.cart);
        const replies = 
            responses(state.actions as AnyAction[], order, catalog);
        console.log(`SHORT-ORDER: "${replies.join(' ')}"`);
        console.log();

        state = {...state, actions: []};
    }
}

const utterances = [
    // May want to preprocess ADD_TO_ORDER + SEPARATOR into ADD_TO_ORDER
    // Proabably don't want to ignore all separators.
    // Perhaps there should be entity-breaking separtors and non-breaking.
    'hi there give me uh a coffee with two creams',

    "let's start over",
    'can I get a cheeseburger well done with no pickles double onion double lettuce and a coffee two cream two sugar',
    'blah blah blah',
    'also get me a hamburger with swiss please',
    'lose the cheeseburger and get me a couple pet chicken',

    // This line give the ADD_TO_ORDER intent followed by NEED_MORE_TIME
    // 'give me a sec',

    'just a sec',

    // May want to preprocess ADD_TO_ORDER + SEPARATOR into ADD_TO_ORDER
    "i'll also take I don't know a surf n turf",

    "make that with a small diet coke",
    "two dozen wings",

    "bbq that'll do it"

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

go('./samples/data/restaurant-en/menu.yaml', utterances, false);

console.log('done');

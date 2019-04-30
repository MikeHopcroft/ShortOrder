import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import {
    actionToString,
    AnyAction,
    responses,
    setup,
    State,
    tokenToString
} from '../src';

function go(utterances: string[], debugMode: boolean) {
    const world = setup(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/options.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.yaml'),
        debugMode
    );
    const { catalog, ops, parser } = world;

    let state: State = { cart: { items: [] }, actions: [] };

    console.log('-----------------------------------------');
    console.log();
    console.log("SHORT-ORDER: \"Welcome to Mike's American Grill. What can I get started for you?\"");
    console.log();

    for (const utterance of utterances) {
        console.log('-----------------------------------------');

        console.log(`CUSTOMER: "${utterance}":`);
        console.log();

        {
            const tokens = world.unified.processOneQuery(utterance);
            console.log(tokens.map(tokenToString).join('\n'));
        }

        state = parser.parseText(utterance, state);
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

        state = { ...state, actions: [] };
    }
}

const utterances1 = [
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

const utterances2 = [
    // 'can I get a cheeseburger well done with no pickles',
    // 'give me a latte',
    // 'give me a decaf latte',
    // 'give me a large latte iced',
    // 'give me a small half caf latte iced',
    'give me a large latte iced iced tea and a coke',
    'give me a small latte decaf decaf latte and a half caf latte',
    // 'give me a chocolate cone',
    // 'give me a cone'
];

const bugs = [
    // This bug no longer repros, now that there is no "fried" attribute.
    // Stemmer confuses "fries" with "fried". Chose attribute "fried" instead
    // of entity "fries". Match for these two has same score.
   'fries',                        // Response: I don't understand

    // This bug has been fixed.
   'no burger',                    // Makes line item for 0 burgers

    // In CatalogOps.updateItem(), "if (n !== quantity)" branch not taken
    // "extra" maps to 1, which is the default quantity.
    'hamburger extra pickles',      // Doesn't add pickles

    // Adds a "six piece wings" and then two hot sauce children.
    // Why hot sauce? Can you add two sauces?
    // Stemmer confuses "wings" and "wing". The latter appears in "wing sauce".
    'six piece wings wings wings',
];

const splashes = [ "can I get a latte with two splashes of cream" ];

// const options = [ "large vanilla pumpkin latte"];
const options = [ "pumpkin latte large"];

go(options, false);

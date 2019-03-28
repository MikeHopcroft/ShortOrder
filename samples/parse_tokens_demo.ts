import * as path from 'path';

import {
    actionToString,
    ADD_TO_ORDER,
    AnyAction,
    AnyToken,
    CreateAttribute,
    CreateEntity,
    CreateIntent,
    CreateNumber,
    CreateQuantity,
    responses,
    setup,
    State,
    tokenToString,
} from '../src';

function go(utterances: AnyToken[][], debugMode: boolean) {
    const { catalog, ops, parser } = setup(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        debugMode
    );

    let state: State = { cart: { items: [] }, actions: [] };

    console.log('-----------------------------------------');
    console.log();
    console.log("SHORT-ORDER: \"Welcome to Mike's American Grill. What can I get started for you?\"");
    console.log();

    for (const utterance of utterances) {
        console.log('-----------------------------------------');

        console.log(`CUSTOMER: "${utterance.map(tokenToString)}":`);
        console.log();

        state = parser.parseTokens(utterance.values(), state);
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

const utterances = [
    // [ADD_TO_ORDER] [NUMBER:1] [ATTRIBUTE:SMALL,1] [ATTRIBUTE:CHOCOLATE,5] [ENTITY:CONE,8000]
    [
        CreateIntent(ADD_TO_ORDER) as AnyToken,
        CreateNumber(1),
        CreateAttribute(1, 'small'),
        CreateAttribute(5, 'chocolate'),
        CreateEntity(8000, 'cone')
    ],
    // [ADD_TO_ORDER] [QUANTITY:1] [ENTITY:CONE,8000]
    [
        CreateIntent(ADD_TO_ORDER) as AnyToken,
        CreateNumber(1),
        CreateEntity(8000, 'cone')
    ]
];

go(utterances, false);

import { AnyToken, ATTRIBUTE, AttributeToken, ENTITY, EntityToken, QUANTITY, QuantityToken, INTENT, IntentToken} from '..';

import {
    ADD_TO_ORDER, ANSWER_AFFIRMATIVE, ANSWER_NEGATIVE, CANCEL_LAST_ITEM, CANCEL_ORDER,
    CONJUNCTION, END_OF_ORDER, NEED_MORE_TIME, PREPOSITION, REMOVE_ITEM, RESTATE,
    SALUTATION, SEPERATOR, SUBSTITUTE
} from '..';

import { Cart, CartOps, Catalog } from '..';
import { PeekableSequence, Token } from 'token-flow';

// TODO: MultipleEntityToken, MultipleAttributeToken

const endOfEntity = [
    ADD_TO_ORDER, ANSWER_AFFIRMATIVE, ANSWER_NEGATIVE, CANCEL_LAST_ITEM, CANCEL_ORDER,
    CONJUNCTION, END_OF_ORDER, NEED_MORE_TIME, PREPOSITION, REMOVE_ITEM, RESTATE,
    SALUTATION, SEPERATOR, SUBSTITUTE
];

// TODO: What is the meaning of "ADD X REMOVE Y Z"?
//   Is it "ADD X REMOVE Y REMOVE Z" or "ADD X REMOVE Y ADD Z"
// Seems like you stay in remove mode until an ADD_TO_ORDER intent is seen.


class Parser {
    catalog: Catalog;
    ops: CartOps;

    constructor(catalog: Catalog) {
        this.catalog = catalog;
        this.ops = new CartOps(catalog);
    }

    parseEntity(input: PeekableSequence<AnyToken>, cart: Cart) {
        let entity = undefined;
        const quantifiers: QuantityToken[] = [];
        const attributes: AttributeToken[] = [];

        // If there is a leading ADD_TO_ORDER token, skip it.
        if (!input.atEOF()) {
            const token = input.peek();
            if (token.type === Symbol.for('ADD_TO_ORDER')) {
                input.get();
            }
        }

        while (!input.atEOF()) {
            const token = input.peek();

            // TODO: need to see if token.type is in a list of production-ending types.
            if (token.type === INTENT) {
                // We're at a new intent.
                // Stop looking for attributes, quantifiers, and entities.
                break;
            }

            if (!entity) {
                // We haven't found an entity yet. Keep looking.
                switch (token.type) {
                    case ATTRIBUTE:
                        attributes.push(token);
                        input.get();
                        break;
                    case ENTITY:
                        entity = token;
                        input.get();
                        // TODO: break out of loop here.
                        break;
                    case QUANTITY:
                        // TODO: do we really want to collect non-adjacent quantities?
                        quantifiers.push(token);
                        input.get();
                        break;
                    default:
                        // TODO: break out of loop here.
                        break;
                }
            }
        }

        if (entity) {
            return this.addEntityToCart(cart, entity, quantifiers, attributes);
        }
        else {
            // TODO: log that we failed to get an entity?
            // TODO: emit token sequence that led to this problem.
            console.log('Parser.parseEntity: no entity detected.');
            return cart;
        }
    }

    // TODO: is there some way to inject a different version of this function
    // for unit testing. Want unit test to just record the calls to this method.
    // Is it ok to rely on monkey patch form sinon or rewire?
    addEntityToCart(cart: Cart, entity: EntityToken, quantifiers: QuantityToken[], attributes: AttributeToken[]) {
        const quantity = Parser.quantityFromTokens(quantifiers);

        // TODO: handle attributes here.

        // TODO: move this to parser constructor.
        const ops = new CartOps(this.catalog);

        // const description = this.catalog.get(entity.pid);
        return ops.updateCart(cart, entity.pid, quantity);
    }

    // https://medium.com/@ustunozgur/object-oriented-functional-programming-or-how-can-you-use-classes-as-redux-reducers-23462a5cae85

    static quantityFromTokens(quantifiers: QuantityToken[]) {
        if (quantifiers.length === 1) {
            // Default is 1.
            return 1;
        }
        else if (quantifiers.length === 1) {
            // If there is one quantifier, just return it.
            return quantifiers[0].value;
        }
        else if (quantifiers.find( x => x.value === 0 )) {
            // If there are multiple quantifiers and at least one is zero,
            // return zero. This handles cases like "with no", where "with"
            // becomes 1 and "no" becomes 0.
            // TODO: should this be solved here or in intents.yaml?
            return 0;
        }
        else {
            // Otherwise, return the maximum quantifer. This handles cases
            // like "with five", where "with" becomes 1 and "five" becomes 5.
            // TODO: should this be solved here or in intents.yaml?
            return Math.max(...quantifiers.map(x => x.value));
        }
    }
}

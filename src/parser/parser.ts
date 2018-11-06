import { AnyToken, ATTRIBUTE, AttributeToken, ENTITY, EntityToken, QUANTITY, QuantityToken, INTENT, IntentToken} from '..';
import { Cart, CartOps, Catalog } from '..';
import { PeekableSequence, Token } from 'token-flow';

// TODO: MultipleEntityToken, MultipleAttributeToken

class Parser {
    catalog: Catalog;

    constructor(catalog: Catalog) {
        this.catalog = catalog;
    }

    parseEntity(input: PeekableSequence<AnyToken>, cart: Cart) {
        let entity = undefined;
        const quantifiers: QuantityToken[] = [];
        const attributes: AttributeToken[] = [];

        while (!input.atEOF()) {
            const token = input.peek();

            if (token.type === INTENT) {
                break;
            }

            if (!entity) {
                switch (token.type) {
                    case ATTRIBUTE:
                        attributes.push(token);
                        break;
                    case ENTITY:
                        entity = token;
                        break;
                    case QUANTITY:
                        quantifiers.push(token);
                        break;
                    default:
                        break;
                }
            }
        }

        if (entity) {
            return this.addEntityToCart(cart, entity, quantifiers, attributes);
        }
        else {
            // TODO: log that we failed to get an entity?
            return cart;
        }
    }

    addEntityToCart(cart: Cart, entity: EntityToken, quantifiers: QuantityToken[], attributes: AttributeToken[]) {
        const quantity = this.quantityFromTokens(quantifiers);

        // TODO: handle attributes here.

        const description = this.catalog.get(entity.pid);
        if (description) {
            if (Catalog.isStandalone(description)) {
                if (quantity === 0) {
                    // We're probably removing an existing item from the cart.
                    // What if existing item is ingredient of another item? E.g. part of a combo/special meal.
                    // TODO: CartOps.transformItems maps function that removes ingredient.
                    return CartOps.removeItems(cart, item => item.pid !== entity.pid);
                }
                else {
                    // We're probably adding some positive quantity of items to the cart.
                    const item = CartOps.createItemInstance(description, quantity);
                    return CartOps.addItem(cart, item);
                }
            }
            else {
                // This item is a component of another item.
                // We're probably adding or removing it from an item already in the cart.
                // Look in cart for most recently added item.
            }
        }
        else {
            // We couldn't find this item in the catalog, even though the tokenizer generated it.
            // Probably a bug.
            // TODO: log unknown PID?
            console.log(`addEntityToCart: unknown item pid=${entity.pid}`);
        }
    }

    // https://medium.com/@ustunozgur/object-oriented-functional-programming-or-how-can-you-use-classes-as-redux-reducers-23462a5cae85

    quantityFromTokens(quantifiers: QuantityToken[]) {
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
            return 0;
        }
        else {
            // Otherwise, return the maximum quantifer. This handles cases
            // like "with five", where "with" becomes 1 and "five" becomes 5.
            return Math.max(...quantifiers.map(x => x.value));
        }
    }
}

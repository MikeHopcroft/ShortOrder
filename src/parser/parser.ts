import { NumberToken, NUMBERTOKEN, PeekableSequence } from 'token-flow';

import { CONFUSED, DONE, OK, WAIT, WELCOME } from '../actions';
import { AttributeInfo, Matrix, MatrixEntityBuilder } from '../attributes';
import { CartOps, State } from '../cart';
import { Catalog } from '../catalog';
import { Unified } from '../unified';

// General tokens
import {
    AnyToken,
    ATTRIBUTE,
    ENTITY,
    OPTION,
    QUANTITY,
    QuantityToken,
    UNIT,
    UnitToken,
    WORD
} from '../unified';

// Specific intent tokens
import {
    ADD_TO_ORDER, ANSWER_AFFIRMATIVE, ANSWER_NEGATIVE, CANCEL_LAST_ITEM, CANCEL_ORDER,
    CONJUNCTION, END_OF_ORDER, NEED_MORE_TIME, PREPOSITION, REMOVE_ITEM, RESTATE,
    SALUTATION, SEPERATOR, SUBSTITUTE
} from '../unified';

const endOfEntity = [
    ADD_TO_ORDER, ANSWER_AFFIRMATIVE, ANSWER_NEGATIVE, CANCEL_LAST_ITEM, CANCEL_ORDER,
    CONJUNCTION, END_OF_ORDER, NEED_MORE_TIME, PREPOSITION, REMOVE_ITEM, RESTATE,
    SALUTATION, SEPERATOR, SUBSTITUTE, UNIT, WORD
];

const startOfEntity = [
    ADD_TO_ORDER, ATTRIBUTE, ENTITY, NUMBERTOKEN, OPTION, QUANTITY
];

const ignore = [
    CONJUNCTION, SEPERATOR
];

// TODO: What is the meaning of "ADD X REMOVE Y Z"?
//   Is it "ADD X REMOVE Y REMOVE Z" or "ADD X REMOVE Y ADD Z"
// Seems like you stay in remove mode until an ADD_TO_ORDER intent is seen.

type QuantifierToken = NumberToken | QuantityToken;

export class Parser {
    private readonly attributeInfo: AttributeInfo;
    private readonly unified: Unified;
    private readonly debugMode: boolean;
    private readonly ops: CartOps;

    constructor(
        catalog: Catalog,
        attributeInfo: AttributeInfo,
        unified: Unified,
        debugMode: boolean
    ) {
        this.attributeInfo = attributeInfo;
        this.unified = unified;
        this.debugMode = debugMode;
        this.ops = new CartOps(catalog, false);
    }

    parseText(input: string, state: State): State {
        const tokens = this.unified.processOneQuery(input) as AnyToken[];
        return this.parseTokens(tokens.values(), state);
    }

    parseTokens(tokens: IterableIterator<AnyToken>, state: State) {
        const sequence = new PeekableSequence<AnyToken>(tokens[Symbol.iterator]());
        return this.parseRoot(sequence, state);
    }

    private parseRoot(input: PeekableSequence<AnyToken>, state: State): State {
        while (!input.atEOF()) {
            const token = input.peek();
            if (startOfEntity.includes(token.type)) {
                state = this.parseEntity(input, state);
            }
            else if (token.type as symbol === NEED_MORE_TIME) {
                const actions = [{ type: WAIT }, ...state.actions];
                state = { ...state, actions };
                input.get();
            }
            else if (token.type as symbol === END_OF_ORDER) {
                const actions = [{ type: DONE }, ...state.actions];
                state = { ...state, actions };
                input.get();
            }
            else if (token.type as symbol === CANCEL_ORDER) {
                const actions = [{ type: WELCOME }, ...state.actions];
                const cart = { items: [] };
                state = { cart, actions };
                input.get();
            }
            else if (token.type as symbol === SALUTATION) {
                input.get();
            }
            else if (ignore.includes(token.type)) {
                input.get();
            }
            else {
                const actions = [{ type: CONFUSED }, ...state.actions];
                state = { ...state, actions };
                input.get();
                if (this.debugMode) {
                    console.log(`Skipped token ${token.type.toString()}`);
                    console.log();
                }
            }
        }
        return state;
    }

    private parseEntity(input: PeekableSequence<AnyToken>, state: State): State {
        const builder = new MatrixEntityBuilder(this.attributeInfo);
        const quantifiers: QuantifierToken[] = [];

        // If there is a leading ADD_TO_ORDER token, skip it.
        if (!input.atEOF()) {
            const token = input.peek();
            if (token.type === Symbol.for('ADD_TO_ORDER')) {
                input.get();
            }
        }

        let stop = false;
        while (!input.atEOF()) {
            const token = input.peek();

            if (endOfEntity.includes(token.type)) {
                break;
            }

            switch (token.type) {
                case ATTRIBUTE:
                    if (builder.addAttribute(token)) {
                        input.get();
                    }
                    else {
                        stop = true;
                    }
                    break;
                case ENTITY:
                    if (builder.hasEntity()) {
                        stop = true;
                    }
                    else {
                        builder.setEntity(token);
                        input.get();
                    }
                    break;
                case OPTION:
                    if (builder.addOption(token)) {
                        input.get();
                    }
                    else {
                        stop = true;
                    }
                    break;
                case NUMBERTOKEN:
                case QUANTITY:
                    // TODO: do we really want to collect non-adjacent quantities?
                    if (builder.hasEntity()) {
                        stop = true;
                    }
                    else {
                        quantifiers.push(token);
                        input.get();

                        if (!input.atEOF()) {
                            const nextToken = input.peek();

                            if (nextToken.type === UNIT) {
                                input.get();
                            }
                        }
                    }
                    break;
                default:
                    // TODO: break out of loop here.
                    // IMPORTANT - really need to ensure unknown token is
                    // pulled from the input, either here or in the caller.
                    // Otherwise code will get in an infinite loop.
                    break;
            }

            if (stop) {
                break;
            }
        }

        let s = state;
        let succeeded = false;
        if (builder.hasEntity()) {
            const quantity = Parser.quantityFromTokens(quantifiers);
            const pid = builder.getPID();

            if (pid !== undefined) {
                s = this.ops.updateCart(s, pid, quantity);
                succeeded = true;
            }
        }

        // Whether we saw an entity or not, add entities associated with any
        // attributes that weren't used to configure specific entity.
        for (const pid of builder.getUnusedAttributes()) {
            const sku = this.attributeInfo.getAttributeSKU(pid);
            if (sku !== undefined) {
                s = this.ops.updateCart(s, sku, 1);
                succeeded = true;
            }
        }

        for (const pid of builder.getOptions()) {
            s = this.ops.updateCart(s, pid, 1);
        }

        if (succeeded) {
            return s;
        }

        // TODO: log that we failed to get an entity?
        // TODO: emit token sequence that led to this problem.
        if (this.debugMode) {
            console.log('Parser.parseEntity: no entity detected.');
        }
        const actions = [{ type: CONFUSED }, ...state.actions];
        return { ...state, actions };
    }

    // // TODO: is there some way to inject a different version of this function
    // // for unit testing. Want unit test to just record the calls to this method.
    // // Is it ok to rely on monkey patch form sinon or rewire?
    // addEntityToCart(cart: Cart, entity: EntityToken, quantifiers: QuantityToken[], attributes: AttributeToken[]) {
    //     const quantity = Parser.quantityFromTokens(quantifiers);

    //     // TODO: handle attributes here.

    //     return this.ops.updateCart(cart, entity.pid, quantity);
    // }

    // https://medium.com/@ustunozgur/object-oriented-functional-programming-or-how-can-you-use-classes-as-redux-reducers-23462a5cae85

    private static quantityFromTokens(quantifiers: QuantifierToken[]) {
        if (quantifiers.length === 0) {
            // Default is 1.
            return 1;
        }
        else if (quantifiers.length === 1) {
            // If there is one quantifier, just return it.
            return quantifiers[0].value;
        }
        else if (quantifiers.find(x => x.value === 0)) {
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

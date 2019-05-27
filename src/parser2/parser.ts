import { AttributeInfo, Cart, CartOps2, Catalog } from 'prix-fixe';
import { NUMBERTOKEN, PeekableSequence } from 'token-flow';

import { Action } from '../actions';
import { Builder, QuantifierToken } from './builder';

import { CONFUSED, DONE, WAIT, WELCOME } from '../actions';
// import { AttributeInfo } from '../attributes';
// import { CartOps, State } from '../cart';
// import { Catalog } from '../catalog';

import { Unified } from '../unified';

// General tokens
import {
    AnyToken,
    ATTRIBUTE,
    ENTITY,
    OPTION,
    QUANTITY,
    UNIT,
    WORD
} from '../unified';

// Specific intent tokens
import {
    ADD_TO_ORDER, ANSWER_AFFIRMATIVE, ANSWER_NEGATIVE, CANCEL_LAST_ITEM, CANCEL_ORDER,
    CONJUNCTION, END_OF_ORDER, NEED_MORE_TIME, PREPOSITION, REMOVE_ITEM, RESTATE,
    SALUTATION, SEPERATOR, SUBSTITUTE
} from '../unified';

// TODO: Where does this definition belong, now that Cart is in PrixFixe?
export interface State {
    cart: Cart;
    actions: Action[];
}

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

export class Parser {
    private readonly attributeInfo: AttributeInfo;
    private readonly unified: Unified;
    private readonly debugMode: boolean;
    private readonly ops: CartOps2;

    constructor(
        catalog: Catalog,
        attributeInfo: AttributeInfo,
        unified: Unified,
        cartOps: CartOps2,
        debugMode: boolean
    ) {
        this.attributeInfo = attributeInfo;
        this.unified = unified;
        this.debugMode = debugMode;
        this.ops = cartOps;
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
        const builder = new Builder(this.attributeInfo);
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
                    if (builder.addAttribute(token.id)) {
                        input.get();
                    }
                    else {
                        stop = true;
                    }
                    break;
                case ENTITY:
                    if (builder.hasPID()) {
                        stop = true;
                    }
                    else {
                        builder.setPID(token.pid);
                        input.get();
                    }
                    break;
                case OPTION:
                    if (builder.addOption(token, 1)) {
                        input.get();
                    }
                    else {
                        stop = true;
                    }
                    break;
                case NUMBERTOKEN:
                case QUANTITY:
                    // TODO: do we really want to collect non-adjacent quantities?
                    if (builder.hasPID()) {
                        stop = true;
                    }
                    else {
                        const quantifier = token;
                        input.get();

                        if (!input.atEOF()) {
                            const next = input.peek();
                            if (next.type === UNIT || next.type === OPTION) {
                                // Looking for QUANTIFIER [UNIT] OPTION

                                // For now, just skip over units.
                                // TODO: check unit type is compatible with option.
                                if (next.type === UNIT) {
                                    input.get();
                                }
    
                                if (!input.atEOF()) {
                                    const option = input.peek();
                                    if (option.type === OPTION) {
                                        input.get();
                                        builder.addOption(option, quantifier.value);
                                    }
                                }    
                            }
                            else {
                                // This is just a quantifier of an upcomming entity.
                                builder.addQuantifier(token);
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
        if (builder.hasPID()) {
            const quantity = builder.getQuantity();
//            const pid = builder.getPID();
            const key = builder.getKey();

            s = this.ops.updateCart(s, pid, quantity);
//            const item = this.ops.createItem(quantity, )
//            s = this.ops.updateCart(s, pid, quantity);
            succeeded = true;
        }

        // Whether we saw an entity or not, add entities associated with any
        // attributes that weren't used to configure specific entity.
        for (const pid of builder.getUnusedAttributes()) {
            const sku = this.attributeInfo.getAttributeSKU(pid);
            if (sku !== undefined) {
                s = this.ops.updateCart(s, sku, 1);
                succeeded = true;
            }
            else {
                // This new attribute might be changing the PID of an existing item.
                //   1. Find item in cart whose matrix contains this attribute's dimension.
                //   2. Generate new key string.
                //   3. Find new item PID.
                //   4. Update item.
            }
        }

        for (const [pid, quantity] of builder.getOptions()) {
            s = this.ops.updateCart(s, pid, quantity);
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
}

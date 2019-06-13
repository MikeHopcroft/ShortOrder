import {
    AID,
    AttributeInfo,
    DID,
    ICartOps,
    ItemInstance,
    PID,
    RuleCheckerOps,
    Tensor
} from 'prix-fixe';

import { NumberToken, NUMBERTOKEN } from 'token-flow';

import {
    AttributeToken,
    OPTION,
    OptionToken,
//    QUANTITY,
    UNIT,
    ATTRIBUTE,
} from '../unified';

import { GapToken, Segment } from './interfaces';
import { TokenSequence } from './token_sequence';

export class EntityBuilder {
    private readonly cartOps: ICartOps;
    private readonly info: AttributeInfo;
    // private readonly rules: RuleCheckerOps;

    private readonly didToAID = new Map<DID,AID>();
    private readonly tokensUsed = 0;

    private quantity = 1;
    private readonly pid: PID;
    private readonly aids: AID[] = [];
    private readonly options: ItemInstance[] = [];

    private readonly tensor: Tensor;

    private readonly item: ItemInstance;

    constructor(segment: Segment, cartOps: ICartOps, info: AttributeInfo) {
        this.cartOps = cartOps;
        this.info = info;

        this.pid = segment.entity.pid;
        this.tokensUsed += 1;

        this.tensor = info.getTensorForEntity(this.pid);

        const leftTokens = new TokenSequence<GapToken>(segment.left);
        this.processLeft(leftTokens);
        this.tokensUsed += leftTokens.tokensUsed;

        const rightTokens = new TokenSequence<GapToken>(segment.right);
        this.processRight(rightTokens);
        this.tokensUsed += rightTokens.tokensUsed;

        this.item = cartOps.createItem(this.quantity, this.pid, this.aids.values(), this.options.values());
    }

    getScore(): number {
        return this.tokensUsed;
    }

    getItem(): ItemInstance {
        return this.item;
    }

    // Process tokens that lie to the left of the entity.
    // This sequence may start with a quantifier. The quantifier may apply to
    // an option, as in "5 pump vanilla latte", in which case the the number of
    // items (lattes) defaults to 1. The quantifier may instead apply to the
    // item, as in "5 vanilla lattes". After the first position, quantifiers
    // only apply to options as in "3 5 pump vanilla latte with 2 pumps of
    // chocolate".
    processLeft(tokens: TokenSequence<GapToken>) {
        if (tokens.startsWith([NUMBERTOKEN, UNIT, OPTION])) {
            // In this case, the NumberToken quantifies the units of an option,
            // so the entity gets a default quantity of 1 (which was set in the
            // member initializer).
            this.processOption(tokens);
        } else {
            // Otherwise, use the NumberToken to quantify the entity.
            this.processQuantity(tokens);
        }

        // The process the remaining tokens.
        this.processRemaining(tokens);
    }

    // Process tokens that lie to the right of the entity. This sequence is
    // considered to be made up of item attributes, and fully specified
    // options.
    processRight(tokens: TokenSequence<GapToken>) {
        this.processRemaining(tokens);
    }

    processRemaining(tokens: TokenSequence<GapToken>): boolean {
        while (!tokens.atEOS()) {
            if (!this.processOption(tokens) && !this.processAttribute(tokens)) {
                return false;
            }
        }
        return true;
    }

    // Attempts to process the next token as an item quantifier. Accepts
    // sequences with the following form:
    //
    //  <NUMBER>
    //
    // Returns true if the number was sucessfully parsed.
    processQuantity(tokens: TokenSequence<GapToken>): boolean {
        if (tokens.startsWith([NUMBERTOKEN])) {
            const quantity = tokens.peek(0) as NumberToken;
            this.quantity = quantity.value;
            tokens.take(1);
            return true;
        }

        return false;
    }

    // Atttempts to process the next tokens as an option. Accepts sequences
    // with the following structure:
    //
    //   <ATTRIBUTE> <OPTION>
    //   [<NUMBER> [<UNIT>]] <OPTION>
    //
    // Where
    //   1. the attribute can legally configure the option
    //   2. the option doesn't violate mutual exclusivity with existing options
    //   3. the option legally configures the item
    //
    // Returns true if an option was successfully parsed.
    processOption(tokens: TokenSequence<GapToken>): boolean {
        // TODO: check for mutual exclusivity.
        // TODO: check whether option legally configures item.
        // compile_error();

        if (tokens.startsWith([ATTRIBUTE, OPTION])) {
            const attribute = tokens.peek(0) as AttributeToken;
            const option = tokens.peek(1) as OptionToken;

            // Check whether attribute configures option.
            const tensor = this.info.getTensorForEntity(option.id);
            const coordinates = this.info.getAttributeCoordinates(attribute.id);
            if (AttributeInfo.hasDimension(tensor, coordinates.dimension.did)) {
                const item = this.cartOps.createItem(1, option.id, [attribute.id].values(), [].values());
                this.options.push(item);
                tokens.take(2);
                return true;    
            } else {
                tokens.discard(2);
                return false;
            }

            // Otherwise fall through to other cases.
        }
        
        if (tokens.startsWith([NUMBERTOKEN, UNIT, OPTION])) {
            const quantity = tokens.peek(0) as NumberToken;
            const option = tokens.peek(2) as OptionToken;
            const item = this.cartOps.createItem(quantity.value, option.id, [].values(), [].values());
            this.options.push(item);
            tokens.take(3);
            return true;
        }
        
        if (tokens.startsWith([NUMBERTOKEN, OPTION])) {
            const quantity = tokens.peek(0) as NumberToken;
            const option = tokens.peek(1) as OptionToken;
            const item = this.cartOps.createItem(quantity.value, option.id, [].values(), [].values());
            this.options.push(item);
            tokens.take(2);
            return true;
        }
        
        if (tokens.startsWith([OPTION])) {
            const option = tokens.peek(0) as OptionToken;
            const item = this.cartOps.createItem(1, option.id, [].values(), [].values());
            this.options.push(item);
            tokens.take(1);
            return true;
        }

        return false;
    }

    // Attempts to process the next token as an item attribute. Accepts
    // sequences with the following form:
    //
    //  <ATTRIBUTE>
    //
    // where the attribute can legally configure the item, and we haven't
    // previously processed an attribute on the same dimension.
    //
    // Returns true if the number was sucessfully parsed.
    processAttribute(tokens: TokenSequence<GapToken>): boolean {
        if (tokens.startsWith([ATTRIBUTE])) {
            // Ensure that the attribute can configure the entity.
            const attribute = tokens.peek(0) as AttributeToken;
            const tensor = this.info.getTensorForEntity(this.pid);
            const coordinates = this.info.getAttributeCoordinates(attribute.id);
            if (AttributeInfo.hasDimension(tensor, coordinates.dimension.did)) {
                // Ensure that we hacven't already seen an attribute on this dimension.
                if (!this.didToAID.has(coordinates.dimension.did)) {
                    this.didToAID.set(coordinates.dimension.did, attribute.id);
                    this.aids.push(attribute.id);
                    tokens.take(1);
                    return true;
                }
            }
        }

        return false;
    }
}

import {
    AID,
    AttributeInfo,
    DID,
    ICartOps,
    ICatalog,
    ItemInstance,
    IRuleChecker,
    OPTION,
    PID,
    ICookbook,
} from 'prix-fixe';

import { NumberToken, NUMBERTOKEN } from 'token-flow';

import {
    ATTRIBUTE,
    AttributeToken,
    CONJUNCTION,
    OptionToken,
    QUANTITY,
    UNIT,
    OPTION_RECIPE,
    OptionRecipeToken,
} from '../lexer';

import { GapToken, Segment } from './interfaces';
import { TokenSequence } from './token_sequence';
import { Parser } from './parser';
import { OrderOps } from '../order';

export class EntityBuilderBase {
    protected readonly cartOps: ICartOps;
    protected readonly catalog: ICatalog;
    protected readonly cookbook: ICookbook;
    private readonly info: AttributeInfo;
    protected readonly rules: IRuleChecker;

    protected readonly generateRegexOptions: boolean;

    private readonly didToAID = new Map<DID,AID>();

    protected tokensUsed = 0;

    protected quantity = 1;
    protected readonly pid: PID;
    protected readonly aids: AID[] = [];
    protected readonly options: ItemInstance[] = [];
    protected readonly optionTokenCounts: number[] = [];

    constructor(
        parser: Parser,
        pid: PID,
        generateRegexOptions: boolean
    ) {
        this.cartOps = parser.cartOps;
        this.catalog = parser.catalog;
        this.cookbook = parser.cookbook;
        this.info = parser.attributes;
        this.rules = parser.rules;

        this.generateRegexOptions = generateRegexOptions;

        this.pid = pid;
        this.tokensUsed += 1;
    }

    getScore(): number {
        return this.tokensUsed;
    }

    // Process tokens that lie to the left of the entity.
    // This sequence may start with a quantifier. The quantifier may apply to
    // an option, as in "5 pump vanilla latte", in which case the the number of
    // items (lattes) defaults to 1. The quantifier may instead apply to the
    // item, as in "5 vanilla lattes". After the first position, quantifiers
    // only apply to options as in "3 5 pump vanilla latte with 2 pumps of
    // chocolate".
    protected processLeft(
        tokens: TokenSequence<GapToken>,
        implicitQuantifiers: boolean
    ) {
        this.processConjunction(tokens);

        // DESIGN NOTE:
        // The following logic was originally included when entity quantifiers
        // were considered optional. This would be important for cases like
        //   "a burger fries and a coke"
        // In that example, "fries" has an implied quantifier of 1.
        // The challenge with prioritizing
        //   [NUMBERTOKEN, UNIT, OPTION]
        // over
        //   [NUMBERTOKEN]
        // is something like
        //   "a large mocha with whole milk split shot one two percent milk large cappuccino and one medium caffe latte with whole milk that's all"
        // In this case
        //   "one two percent milk"
        // matches
        //   [NUMBERTOKEN, UNIT, OPTION]
        // when "one" is realy an entity quantifier.
        //
        // if (tokens.startsWith([NUMBERTOKEN, UNIT, OPTION])) {
        //     // In this case, the NumberToken quantifies the units of an option,
        //     // so the entity gets a default quantity of 1 (which was set in the
        //     // member initializer).
        //     this.processOption(tokens);
        // } else {
        //     // Otherwise, use the NumberToken to quantify the entity.
        //     this.processQuantity(tokens);
        // }
        // this.processRemaining(tokens);

        // // New code
        // DESGIN NOTE: Must check implicitQuantifiers after processQuantity()
        // to ensure that we always get the quantifier if there is one.
        if (this.processQuantity(tokens) || implicitQuantifiers) {
            // Then process the remaining tokens.
            this.processRemaining(tokens);
        }

        this.tokensUsed += tokens.tokensUsed;
    }

    // Process tokens that lie to the right of the entity. This sequence is
    // considered to be made up of item attributes, and fully specified
    // options.
    protected processRight(tokens: TokenSequence<GapToken>) {
        this.processRemaining(tokens);
        this.tokensUsed += tokens.tokensUsed;
    }

    private processRemaining(tokens: TokenSequence<GapToken>): boolean {
        while (!tokens.atEOS()) {
            this.processConjunction(tokens);

            if (tokens.atEOS()) {
                break;
            }

            if (this.processOption(tokens)) {
                continue;
            }

            if (this.processAttribute(tokens)) {
                continue;
            }

            // We were unable to consume the next token.
            // Discard it and move forward.
            tokens.discard(1);
        }

        return true;
    }

    // Attempts to process the next token as a conjunction. Accepts
    // seqeuences of the following form:
    //
    //  <CONJUNCTION>
    //
    // Returns true if the conjunction was successfully parsed.
    private processConjunction(tokens: TokenSequence<GapToken>): boolean {
        if (tokens.startsWith([CONJUNCTION])) {
            tokens.take(1);
            return true;
        }
        return false;
    }

    // Attempts to process the next token as an item quantifier. Accepts
    // sequences with the following form:
    //
    //  <NUMBER>
    //
    // Returns true if the number was sucessfully parsed.
    private processQuantity(tokens: TokenSequence<GapToken>): boolean {
        if (tokens.startsWith([NUMBERTOKEN])) {
            const quantity = tokens.peek(0) as NumberToken;
            this.quantity = quantity.value;
            tokens.take(1);
            return true;
        }
        else if (tokens.startsWith([QUANTITY])) {
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
    // Returns true if option tokens were consumed, even if they couldn't be
    // used for the item under construction.
    private processOption(tokens: TokenSequence<GapToken>): boolean {
        // TODO: check for mutual exclusivity.
        //   Challenge is that we cannot check for exclusivity until we know
        //   the product key, which we won't know until we have processed all
        //   of the attributes.
        // TODO: is every option mutually exclusive of itself?
        //   e.g. latte with pumpkin syrup and pumpkin syrup
        // TODO: check whether option legally configures item.
        // compile_error();

        if (tokens.startsWith([OPTION_RECIPE])) {
            const token = tokens.peek(0) as OptionRecipeToken;
            // TODO: pass in parent key - currently second argument is ignored.
            const recipe = this.cookbook.findOptionRecipe(token.rid, 'TODO');
            const items = this.cartOps.createItemsFromOptionRecipe(recipe);
            this.options.push(...items);
            this.optionTokenCounts.push(1);
            tokens.take(1);
            return true;
        } else if (tokens.startsWith([ATTRIBUTE, OPTION])) {
            const attribute = tokens.peek(0) as AttributeToken;
            const option = tokens.peek(1) as OptionToken;

            // Check whether attribute configures option.
            const tensor = this.info.getTensorForEntity(option.id);
            const coordinates = this.info.getAttributeCoordinates(attribute.id);
            if (AttributeInfo.hasDimension(tensor, coordinates.dimension.did)) {
                const item = this.cartOps.createItem(
                    1,
                    option.id,
                    [attribute.id].values(),
                    [].values(),
                    this.generateRegexOptions
                );
                this.options.push(item);
                this.optionTokenCounts.push(2);
                tokens.take(2);
                return true;
            } else {
                // Fall back to outer loop to try processAttribute().
                // Don't take or discard tokens.
                return false;
            }

            // Otherwise fall through to other cases.
        }

        if (tokens.startsWith([NUMBERTOKEN, UNIT, OPTION])) {
            const quantity = tokens.peek(0) as NumberToken;
            const option = tokens.peek(2) as OptionToken;
            const item = this.cartOps.createItem(
                // NEED to clamp value to legal ranges or fail if out of range
                quantity.value,
                option.id,
                [].values(),
                [].values(),
                this.generateRegexOptions
            );
            this.options.push(item);
            this.optionTokenCounts.push(3);
            tokens.take(3);
            return true;
        }

        if (tokens.startsWith([NUMBERTOKEN, OPTION])) {
            const quantity = tokens.peek(0) as NumberToken;
            const option = tokens.peek(1) as OptionToken;
            const item = this.cartOps.createItem(
                // NEED to clamp value to legal ranges or fail if out of range
                quantity.value,
                option.id,
                [].values(),
                [].values(),
                this.generateRegexOptions
            );
            this.options.push(item);
            this.optionTokenCounts.push(2);
            tokens.take(2);
            return true;
        }

        if (tokens.startsWith([OPTION])) {
            const option = tokens.peek(0) as OptionToken;
            const item = this.cartOps.createItem(
                1,
                option.id,
                [].values(),
                [].values(),
                this.generateRegexOptions
            );
            this.options.push(item);
            this.optionTokenCounts.push(1);
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
    // Returns true if attribute tokens were consumed, even if they could 
    // not be used for the product.
    private processAttribute(tokens: TokenSequence<GapToken>): boolean {
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

            // Skip over this attribute since it cannot be consumed.
            tokens.discard(1);
            return true;
        }

        return false;
    }

    filterIllegalOptions(parent: ItemInstance): ItemInstance[] {
        // TODO: filter out illegal options here.
        const legalOptions: ItemInstance[] = [];
        for (const [index, option] of this.options.entries()) {
            if (this.rules.isValidChild(parent.key, option.key) &&
                this.catalog.hasKey(option.key)) {
                legalOptions.push(option);
            } else {
                // This option cannot legally configure the item.
                // Exclude it and adjust the used token count accordingly.
                this.tokensUsed -= this.optionTokenCounts[index];
            }
        }

        // Use key to filter out options that violate mutual exclusivity.
        const f = this.rules.getIncrementalMutualExclusionPredicate(parent.key);
        const filteredOptions: ItemInstance[] = [];
        for (const [index, option] of legalOptions.entries()) {
            if (f(option.key)) {
                filteredOptions.push(option);
            } else {
                // This option violated mutual exclusivity with the previous
                // options. Exclude it and adjust the used token count
                // accordingly.
                // TODO: BUGBUG: optionTokenCounts is not filtered, so
                // we're potentially using the wrong count here.
                this.tokensUsed -= this.optionTokenCounts[index];
            }
        }

        return filteredOptions;
    }
}

export class EntityBuilder extends EntityBuilderBase {
    private readonly item: ItemInstance;

    constructor(
        parser: Parser,
        segment: Segment
    ) {
        super(parser, segment.entity, false);

        this.processLeft(new TokenSequence<GapToken>(segment.left), false);
        this.processRight(new TokenSequence<GapToken>(segment.right));

        // Initially, create item without options, in order to get key.
        const item = this.cartOps.createItem(
            this.quantity,
            this.pid, 
            this.aids.values(),
            [].values(),
            false   // Don't generate regex Key
        );

        // Construct item with filtered options.
        const filteredOptions = this.filterIllegalOptions(item);
        this.item = {...item, children: filteredOptions};
    }

    getItem(): ItemInstance {
        return this.item;
    }
}

export class TargetBuilder extends EntityBuilderBase {
    private readonly item: ItemInstance;

    constructor(
        parser: Parser,
        left: GapToken[],
        pid: PID,
        right: GapToken[],
    ) {
        super(parser, pid, false);

        this.processRight(new TokenSequence<GapToken>(left));
        this.processRight(new TokenSequence<GapToken>(right));

        // Initially, create item without options, in order to get key.
        const item = this.cartOps.createItem(
            this.quantity,
            this.pid, 
            this.aids.values(),
            [].values(),
            true    // Generate regex Key
        );

        // We don't have a Key (we only have a regex) so we can't use the
        // rules checker to filter out options.
        // Construct item with unfiltered options.
        this.item = {...item, children: this.options};
    }

    getItem(): ItemInstance {
        return this.item;
    }
}

export class OptionTargetBuilder extends EntityBuilderBase {
    constructor(
        parser: Parser,
        tokens: GapToken[],
    ) {
        const dummyPid: PID = 0;
        super(parser, dummyPid, true);

        this.processRight(new TokenSequence<GapToken>(tokens));
    }

    getOption(): ItemInstance | undefined {
        if (this.options.length > 0) {
            return this.options[0];
        } else {
            return undefined;
        }
    }
}

export class ModificationBuilder extends EntityBuilderBase {
    private readonly item: ItemInstance;

    constructor(
        parser: Parser,
        original: ItemInstance,
        modifications: GapToken[],
        combineQuantities: boolean
    ) {
        const pid: PID = AttributeInfo.pidFromKey(original.key);
        super(parser, pid, false);

        this.processRight(new TokenSequence<GapToken>(modifications));

        // Initially, create item without options, in order to get key.
        let modified = this.cartOps.changeItemAttributes(
            {...original, children: []},
            this.aids.values()
        );

        // Filter the new options for legality and mutual exclusivity amongst
        // themselves.
        const filteredOptions = this.filterIllegalOptions(modified);

        // Copy over the options from the original item before adding options
        // from the replacement item. This ensures that a replacement option
        // will supercede an original option.
        for (const option of original.children) {
            if (
                this.rules.isValidChild(modified.key, option.key) // &&
            ) {
                modified = this.cartOps.addToItem(
                    modified,
                    option
                );
            }
        }

        // Add the replacement items, with replacement enabled for items in the
        // same mutual exclusion set.
        for (const option of filteredOptions) {
            if (this.rules.isValidChild(modified.key, option.key)) {
                modified = this.cartOps.addToItemWithReplacement(
                    modified,
                    option,
                    combineQuantities,
                );
            }
        }
        this.item = modified;

        // const item = this.cartOps.changeItemAttributes(
        //     original,
        //     this.aids.values()
        // );

        // // Construct item with filtered options.
        // const filteredOptions = this.filterIllegalOptions(item);
        // this.item = {...item, children: filteredOptions};
    }

    getItem(): ItemInstance {
        return this.item;
    }
}

export class ReplacementBuilder extends EntityBuilderBase {
    private readonly item: ItemInstance;

    constructor(
        parser: Parser,
        original: ItemInstance,
        segment: Segment
    ) {
        super(parser, segment.entity, false);

        // TODO: copy AIDs from original.
        // Need some way to take the last AID on a dimension.
        // Perhaps make an AID set accumulator with different
        // semantics at construction time?
        // Perhaps ICartOps.createItem() can have a flag
        // that indicates whether first or last AID on dimension
        // wins.
        //
        // 119 - FAILED
        //   Comment: cappuccino should be tall like latte
        //   Suites: modify regression
        //   Utterance 0: "i added a tall latte"
        //     "0/1/tall caffe latte/407:0:1" === "0/1/tall caffe latte/407:0:1" - OK
        //   Utterance 1: "i made the latte a cappuccino"
        //     "0/1/tall cappuccino/409:0:1" !== "0/1/grande cappuccino/409:0:2" - <=== ERROR

        // Process the tokens to add the new item's configuration.
        this.processLeft(new TokenSequence<GapToken>(segment.left), false);
        this.processRight(new TokenSequence<GapToken>(segment.right));

        // Initially, create item without options, in order to get key.
        let replacement = this.cartOps.createItem(
            this.quantity,
            this.pid, 
            this.aids.values(),
            [].values(),
            false   // Don't generate regex Key
        );

        // Filter the new options for legality and mutual exclusivity amongst
        // themselves.
        const filteredOptions = this.filterIllegalOptions(replacement);

        // Copy over the options from the original item before adding options
        // from the replacement item. This ensures that a replacement option
        // will supercede an original option.
        for (const option of original.children) {
            if (this.rules.isValidChild(replacement.key, option.key)) {
                replacement = this.cartOps.addToItem(
                    replacement,
                    option
                );
            }
        }

        // Add the replacement items, with replacement enabled for items in the
        // same mutual exclusion set.
        for (const option of filteredOptions) {
            if (this.rules.isValidChild(replacement.key, option.key)) {
                replacement = this.cartOps.addToItemWithReplacement(
                    replacement,
                    option,
                    false
                );
            }
        }
        this.item = replacement;
    }

    getItem(): ItemInstance {
        return this.item;
    }
}

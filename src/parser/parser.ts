import {
    AttributeInfo,
    ICartOps,
    ItemInstance, 
    IRuleChecker,
    State
} from 'prix-fixe';

import { Token, NUMBERTOKEN } from 'token-flow';

import {
    ADD_TO_ORDER,
    ATTRIBUTE,
    CONJUNCTION,
    ENTITY,
    EntityToken,
    tokenToString,
    LexicalAnalyzer,
    OPTION,
    QUANTITY,
    UNIT,
    REMOVE_ITEM,
    Span
} from '../lexer';

import { EntityBuilder } from './entity_builder';

import {
    HypotheticalItem,
    Interpretation,
    ProductToken,
    Segment,
    SequenceToken,
    PRODUCT_PARTS
} from './interfaces';

import {
    enumerateSplits,
    splitOnEntities,
} from './parser_utilities';

import { TokenSequence } from './token_sequence';

// ActionFunction that does nothing.
function nop(state: State): State {
    return state;
}

export class Parser {
    private readonly cartOps: ICartOps;
    private readonly info: AttributeInfo;
    private readonly rules: IRuleChecker;
    private readonly debugMode: boolean;

    intentTokens = [
        ADD_TO_ORDER,
        REMOVE_ITEM
    ];

    validTokens = new Set<Symbol>([
        // Intents
        ADD_TO_ORDER,
        REMOVE_ITEM,

        // Product-related
        ATTRIBUTE,
        CONJUNCTION,
        ENTITY,
        OPTION,
        NUMBERTOKEN,
        QUANTITY,
        UNIT,
    ]);

    constructor(
        cartOps: ICartOps,
        info: AttributeInfo,
        rules: IRuleChecker,
        debugMode: boolean
    ) {
        this.cartOps = cartOps;
        this.info = info;
        this.rules = rules;
        this.debugMode = debugMode;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Existing code based on Token (vs TokenX)
    //
    ///////////////////////////////////////////////////////////////////////////
    parseRoot(lexer: LexicalAnalyzer, state: State, text: string): Interpretation {
        // XXX
        if (this.debugMode) {
            console.log(' ');
            console.log(`Text: "${text}"`);
        }

        const tokenizations = [...lexer.tokenizations2(text)];
        const interpretations: Interpretation[] = [];

        // TODO: figure out how to remove the type assertion to any.
        // tslint:disable-next-line:no-any
        const start = (process.hrtime as any).bigint();
        let counter = 0;
        for (const tokenization of tokenizations) {
            // XXX
            const tokens = tokenization.tokens;
            if (this.debugMode) {
                console.log(' ');
                console.log(tokens.map(tokenToString).join(''));
                // console.log(`  interpretation ${counter}`);
            }
            counter++;

            interpretations.push(this.parseRootStage2(state, tokens));
        }

        // TODO: figure out how to remove the type assertion to any.
        // tslint:disable-next-line:no-any
        const end = (process.hrtime as any).bigint();
        const delta = Number(end - start);
        // XXX
        if (this.debugMode) {
            console.log(`${counter} interpretations.`);
            console.log(`Time: ${delta/1.0e6}`);
        }

        // TODO: eventually place the following code under debug mode.
        if (delta/1.0e6 > 65) {
        // if (delta/1.0e6 > 1) {
            console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
            console.log(`Time: ${delta/1.0e6}ms`);
            console.log(`  "${text}"`);
            lexer.analyzePaths(text);
        }

        if (interpretations.length > 0) {
            // We found at least one interpretation.
            // Sort interpretations by decreasing score.
            interpretations.sort((a, b) => b.score - a.score);

            // Return the highest scoring interpretation.
            // TODO: when there is more than one top-scoring interpretations,
            // probably want to pick the one that associates right.
            return interpretations[0];
        } else {
            // We didn't find any interpretations.
            // Return an empty interpretation.
            return {score: 0, items: [], action: nop}; 
        }
    }

    parseRootStage2(
        state: State,
        tokens: Array<Token & Span>
    ): Interpretation {
        const filtered = this.filterBadTokens(tokens);
        const grouped = new TokenSequence<Token>(
            this.groupProductParts(filtered)
        );

        // TODO: should not return directly from inside this loop.
        // There might be multiple intents in the utterance.
        // DESIGN ISSUE: What if processing the first intent invalidates
        // the interpretation of subsequent intents (e.g. first intent
        // removes item modified by second intent)?
        while (!grouped.atEOS()) {
            if (grouped.startsWith([ADD_TO_ORDER, PRODUCT_PARTS])) {
                const add = grouped.peek(0);
                const parts = (grouped.peek(1) as ProductToken).tokens;
                grouped.take(2);
                return this.findBestInterpretation(parts);
            } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
                console.log('REMOVE_ITEM not implemented');
                const remove = grouped.peek(0);
                const parts = (grouped.peek(1) as ProductToken).tokens;
                grouped.take(2);
                return this.parseRemove(state, parts);
            } else {
                grouped.discard(1);
            }
        }

        // We didn't find any interpretations.
        // Return an empty interpretation.
        return {score: 0, items: [], action: nop}; 
    }

    filterBadTokens(tokens: Array<Token & Span>): Array<Token & Span> {
        return tokens.filter( token => this.validTokens.has(token.type));
    }


    // TODO: get type system right here
    groupProductParts(tokens: Array<Token & Span>): Array<Token & Span> {
        const grouped = new Array<Token & Span>();
        let productParts = new Array<SequenceToken & Span>();

        const tryCreateProductParts = () => {
            if (productParts.length > 0) {
                const start = productParts[0].start;
                const length =
                    productParts.reduce((sum, x) => sum + x.length, 0);
                grouped.push({
                    type: PRODUCT_PARTS,
                    tokens: productParts,
                    start,
                    length
                } as ProductToken & Span);
                productParts = [];
            }
        };

        for (const token of tokens) {
            if (!this.intentTokens.includes(token.type)) {
                // Code assumes that anything not in intentTokens is a
                // SequenceToken. Gather SeqeuenceTokens in productParts.
                productParts.push(token as SequenceToken & Span);
            } else {
                // We've reached an intent token.
                tryCreateProductParts();
                grouped.push(token);
            }
        }
        if (productParts.length > 0) {
            tryCreateProductParts();
        }
        return grouped;
    }

    parseRemove(
        state: State,
        tokens: Array<SequenceToken & Span>
    ): Interpretation {
        const {entities, gaps} = splitOnEntities(tokens);
        const segment: Segment = {
            left: gaps[0],
            entity: entities[0],
            right: gaps[1]
        };
        const x = this.interpretOneSegment(segment);
        if (x.item !== undefined) {
            console.log(`============ Removing ${x.item.key} ==============`);
            const found = this.cartOps.findByKey(state.cart, x.item.key).next();
            if (!found.done) {
                console.log(`  Removing item uid=${found.value.uid}`);

                const action = (state: State): State => {
                    const cart = this.cartOps.removeFromCart(state.cart, found.value.uid);
                    return {...state, cart};
                };

                return { score: x.score, items: [x.item], action };
            }
        }
        return {score: 0, items: [], action: nop}; 
    }

    findBestInterpretation(tokens: SequenceToken[]): Interpretation {
        const interpretations: Interpretation[] = [];

        // Break into sequence of gaps and the entities that separate them.
        const {entities, gaps} = splitOnEntities(tokens);

        // Enumerate all combinations of split points in gaps.
        const lengths: number[] = gaps.map(x => x.length);

        for (const splits of enumerateSplits(lengths)) {
            // TODO: split debug tracing
            // console.log(`split = [${splits}]`);

            // Construct the sequence of Segments associated with a particular
            // choice of split points.
            const segments: Segment[] = entities.map( (entity: EntityToken, index: number) => ({
                left: gaps[index].slice(splits[index]),
                entity,
                right: gaps[index + 1].slice(0, splits[index + 1]),
            }));

            // TODO: split debug tracing
            // for (const segment of segments) {
            //     printSegment(segment);
            // }

            // Parse these segments to produce an interpretation for this
            // choice of split points.
            // TODO: BUGBUG: following line modifies segments[X].left, right
            // TODO: BUGBUG: TokenSequence shouldn't modifiy tokens[].
            const interpretation = this.interpretSegmentArray(segments);

            // TODO: split debug tracing
            // console.log(`  score: ${interpretation.score}`);
            // console.log('');

            interpretations.push(interpretation);
        }

        // console.log(`  interpretations: ${interpretations.length}`);

        if (interpretations.length > 0) {
            // We found at least one interpretation.
            // Sort interpretations by decreasing score.
            interpretations.sort((a, b) => b.score - a.score);

            // Return the highest scoring interpretation.
            // TODO: when there is more than one top-scoring interpretations,
            // probably want to pick the one that associates right.
            return interpretations[0];
        } else {
            // We didn't find any interpretations.
            // Return an empty interpretation.
            return {score: 0, items: [], action: nop}; 
        }
    }

    private interpretSegmentArray(segments: Segment[]): Interpretation {
        let score = 0;
        const items: ItemInstance[] = [];
        for (const segment of segments) {
            const x = this.interpretOneSegment(segment);
            if (x.item !== undefined) {
                score += x.score;
                items.push(x.item);
            }
        }

        const action = (state: State): State => {
            let updated = state.cart;
            for (const item of items) {
                updated = this.cartOps.addToCart(updated, item);
            }
    
            return {...state, cart: updated};
        };

        return {score, items, action};
    }

    private interpretOneSegment = (segment: Segment): HypotheticalItem => {
        const builder = new EntityBuilder(segment, this.cartOps, this.info, this.rules);
        return {
            score: builder.getScore(),
            item: builder.getItem()
        };
    }
}

function printSegment(segment: Segment) {
    const left = segment.left.map(tokenToString).join('');
    const entity = tokenToString(segment.entity);
    const right = segment.right.map(tokenToString).join('');

    console.log('  Segment');
    console.log(`    left: ${left}`);
    console.log(`    entity: ${entity}`);
    console.log(`    right: ${right}`);
}


import {
    AttributeInfo,
    ICartOps,
    ItemInstance, 
    IRuleChecker,
    State
} from 'prix-fixe';

import { Token, NUMBERTOKEN, Graph } from 'token-flow';

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
    Span,
    Tokenization
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

import { subgraphFromItems } from './target';
import { TokenSequence } from './token_sequence';

// ActionFunction that does nothing.
function nop(state: State): State {
    return state;
}

export class Parser {
    private readonly cartOps: ICartOps;
    private readonly info: AttributeInfo;
    private readonly lexer: LexicalAnalyzer;
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

    // TODO: Parser shouldn't be coupled to LexicalAnalyzer. It should take an
    // interface to a graph manipulation class or perhaps that code could be
    // extracted from LexicalAnalyzer and exposed as simple functions.
    // TODO: Fix LexicalAnalyzer hack (undefined!) in unit tests.
    constructor(
        cartOps: ICartOps,
        info: AttributeInfo,
        lexer: LexicalAnalyzer,
        rules: IRuleChecker,
        debugMode: boolean
    ) {
        this.cartOps = cartOps;
        this.info = info;
        this.lexer = lexer;
        this.rules = rules;
        this.debugMode = debugMode;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Existing code based on Token (vs TokenX)
    //
    ///////////////////////////////////////////////////////////////////////////
    parseRoot(state: State, text: string): Interpretation {
        // XXX
        if (this.debugMode) {
            console.log(' ');
            console.log(`Text: "${text}"`);
        }

        const tokenizations = [...this.lexer.tokenizations2(text)];
        const interpretations: Interpretation[] = [];

        // TODO: figure out how to remove the type assertion to any.
        // tslint:disable-next-line:no-any
        const start = (process.hrtime as any).bigint();
        let counter = 0;
        for (const tokenization of tokenizations) {
            // XXX
            if (this.debugMode) {
                const tokens = tokenization.tokens;
                console.log(' ');
                console.log(tokens.map(tokenToString).join(''));
                // console.log(`  interpretation ${counter}`);
            }
            counter++;

            interpretations.push(this.parseRootStage2(state, tokenization));
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
            this.lexer.analyzePaths(text);
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
        tokenization: Tokenization
    ): Interpretation {
        const tokens = tokenization.tokens;
        const graph = tokenization.graph;

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
                const parts = (grouped.peek(1) as ProductToken).tokens;
                grouped.take(2);
                return this.findBestInterpretation(parts);
            } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
                console.log('REMOVE_ITEM not implemented');
                const parts = (grouped.peek(1) as ProductToken).tokens;
                grouped.take(2);
                return this.parseRemove(state, { tokens: parts, graph });
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
        tokenization: Tokenization,
        // tokens: Array<SequenceToken & Span>,
        // graph: Graph
    ): Interpretation {
        // const tokens = tokenization.tokens as Array<SequenceToken & Span>;
        // const graph = tokenization.graph;

        const interpretation: Interpretation = {
            score: 0,
            items: [],
            action: nop
        };

        for (const target of this.targets(state, tokenization)) {
            if (target.score > interpretation.score) {
                const item = target.item!;
                interpretation.score = target.score;
                interpretation.items = [target.item!];
                interpretation.action = (state: State): State => {
                    const cart = this.cartOps.removeFromCart(state.cart, item.uid);
                    return {...state, cart};
                };
            }
        }

        return interpretation;

        // const {entities, gaps} = splitOnEntities(tokens);
        // const segment: Segment = {
        //     left: gaps[0],
        //     entity: entities[0],
        //     right: gaps[1]
        // };
        // // Create subgraph
        // //   Span based on tokens.
        // //   Edges filtered by cart.
        // // Run lexer on subgraph to get tokenization
        // // For each tokenization
        // //   
        // const x = this.interpretOneSegment(segment);
        // if (x.item !== undefined) {
        //     console.log(`============ Removing ${x.item.key} ==============`);
        //     const found = this.cartOps.findByKey(state.cart, x.item.key).next();
        //     if (!found.done) {
        //         console.log(`  Removing item uid=${found.value.uid}`);

        //         const action = (state: State): State => {
        //             const cart = this.cartOps.removeFromCart(state.cart, found.value.uid);
        //             return {...state, cart};
        //         };

        //         return { score: x.score, items: [x.item], action };
        //     }
        // }
        // return {score: 0, items: [], action: nop}; 
    }

    // TODO: ISSUE: does this return an iterator of HypotheticalItems,
    // correponding to ItemInstances in the cart for one Interpretation,
    // or for all Interpretations? Issue is that one doesn't want to see
    // the same item twice. Is the solution to collect the ItemInstances
    // in a Set? This seems wrong because in the case of, say, a remove
    // operation with two Interpretations, one want to remove only one
    // target.
    //
    // TODO: a target might also be implicit, if the tokens don't contain
    // an entity.
    //
    // TODO: remove an option from an implicit entity - e.g. 'I removed the decaf'
    // TODO: remove an attribute from an implicit entity - e.g. 'I removed the large` - doesn't make sense
    // Seems you can change/modify an attribute, but not remove it.
    *targets(
        state: State,
        tokenization: Tokenization,
        // tokens: Array<SequenceToken & Span>,
        // graph: Graph
    ): IterableIterator<HypotheticalItem> {
        const tokens = tokenization.tokens;
        const graph = tokenization.graph;
        const cart = state.cart;

        //
        // Construct lexical subgraph corresponding to items in the cart.
        //

        // Subgraph span will be that of `tokens`.
        const last = tokens[tokens.length - 1];
        const span: Span = {
            start: tokens[0].start,
            length: last.start + last.length
        };

        // Subgraph edges will correspond to tokens for items in `cart`.
        const subgraph = subgraphFromItems(this.info, this.lexer, cart, graph, span);
        
        // Try each tokenization of the subgraph
        const tokenizations = this.lexer.tokenizationsFromGrap2(subgraph);
        for (const tokenization of tokenizations) {
            const {entities, gaps} = splitOnEntities(tokenization.tokens as SequenceToken[]);
            const segment: Segment = {
                left: gaps[0],
                entity: entities[0],
                right: gaps[1]
            };
            const builder = new EntityBuilder(segment, this.cartOps, this.info, this.rules);
            const target = builder.getItem();
//            const x = this.interpretOneSegment(segment);
            if (target !== undefined) {
                console.log(`============ Hypothetical target ${target.key} ==============`);
                // Yield matching ItemInstances from the cart.
                // TODO: we need a predicate that treats unspecified attributes as wildcards.
                // Need to know whether an attribute is default because it was omitted or
                // specified as the default value.
                // Perhaps EntityBuilder needs a wildcard mode.
                for (const item of this.cartOps.findByKey(state.cart, target.key)) {
                    yield {
                        item,
                        score: builder.getScore()
                    };
                }
            }
        }
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


import {
    AttributeInfo,
    PID, 
    State,
} from 'prix-fixe';

import { Graph, Token } from 'token-flow';

import {
    createSpan,
    EntityToken,
    MODIFY_ITEM,
    PREPOSITION,
    PROLOGUE,
    Span,
    tokenToString,
} from '../lexer';

import { EntityBuilder, ModificationBuilder } from './entity_builder';

import {
    GapToken,
    HypotheticalItem,
    Interpretation,
    nop,
    PRODUCT_PARTS_0,
    PRODUCT_PARTS_1,
    PRODUCT_PARTS_N,
    ProductToken,
    ProductToken0,
    ProductToken1,
    Segment,
    SequenceToken,
} from './interfaces';

import { Parser } from "./parser";
import { enumerateSplits, splitOnEntities } from './parser_utilities';
import { targets } from './target';
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product modification operation.
//
// Assumes that `tokens` starts with:
//     [PROLOGUE] MODIFY_ITEM (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
export function processModify(
    parser: Parser,
    state: State,
    tokens: TokenSequence<Token & Span>,
    graph: Graph,
): Interpretation {
    if (tokens.peek(0).type === PROLOGUE) {
        tokens.take(1);
    }
    if (tokens.peek(0).type === MODIFY_ITEM) {
        tokens.take(1);
    }

    if (!tokens.atEOS()) {
        if (tokens.startsWith([PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_0])) {
            // * (made,changed) [the,that,your] P1 (into,to,with) [a] P0
            const target = tokens.peek(0) as ProductToken1 & Span;
            const modification = tokens.peek(2) as ProductToken0 & Span;
            tokens.take(3);
            // console.log('CASE I: modifying');
            // console.log(`  ${target.tokens.map(tokenToString).join('')}`);
            // console.log(`with`);
            // console.log(`  ${modification.tokens.map(tokenToString).join('')}`);
            return parseAddToTarget(
                parser,
                state,
                graph,
                modification.tokens,
                target.tokens
            );
        } else if (tokens.startsWith([PREPOSITION, PRODUCT_PARTS_0])) {
            // * (made,changed) [that] (into,to,with) [a] P0
            const modification = tokens.peek(1) as ProductToken0 & Span;
            tokens.take(2);
            return parseAddToImplicit(
                parser,
                state,
                graph,
                modification.tokens
            );
        } else if (tokens.startsWith([PRODUCT_PARTS_0])) {
            // Here all tokens to the left roll into the MODIFY_ITEM
            // * (made,changed) [that] P0
            const modification = tokens.peek(0) as ProductToken0 & Span;
            tokens.take(1);
            return parseAddToImplicit(
                parser,
                state,
                graph,
                modification.tokens
            );
        } else if (tokens.startsWith([PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_1])) {
                // * (made,changed,replaced) [the,that,your] P1 (into,to,with) [a] P1
                const target = tokens.peek(0) as ProductToken1 & Span;
                const replacement = tokens.peek(2) as ProductToken0 & Span;
                tokens.take(3);
                return parseReplaceTarget(
                    parser,
                    state,
                    graph,
                    target.tokens,
                    replacement.tokens,
                );
        } else if (tokens.startsWith([PRODUCT_PARTS_N])) {
                // * (made,changed,replaced) [the,that,your] (into,to,with) [a] P1
                const parts = tokens.peek(0) as ProductToken1 & Span;
                tokens.take(1);
                return parseReplace1(
                    parser,
                    state,
                    graph,
                    parts.tokens
                );
        } else if (tokens.startsWith([PRODUCT_PARTS_1])) {
            // * (made,changed) [the,that,your] P1 [a] P0
            const parts = tokens.peek(0) as ProductToken1 & Span;
            tokens.take(1);
            // console.log('CASE II: target and modifications adjacent');
            // console.log(`  ${parts.tokens.map(tokenToString).join('')}`);
            return processModify1(
                parser,
                state,
                graph,
                parts.tokens
            );
        } else if (tokens.startsWith([PREPOSITION, PRODUCT_PARTS_1])) {
            // * (made,changed) [that] (into,to,with) [a] P1
            const modification = tokens.peek(1) as ProductToken1 & Span;
            tokens.take(2);
            return parseReplaceImplicit(
                parser,
                state,
                graph,
                modification.tokens
            );
        } else {
            // console.log('CASE III: error: multiple targets');
            tokens.take(1);
        }
    }

    return nop;
}

function processModify1(
    parser: Parser,
    state: State,
    graph: Graph,
    productAndModification: Array<SequenceToken & Span>
): Interpretation {
    let best = nop;

    const {entities, gaps} = splitOnEntities(productAndModification);
    if (gaps.length === 2 && gaps[1].length >= 1) {
        // We have exactly one entity (two gaps) and the gap to the right of
        // the entity has at least one token.

        const product = [...gaps[0], entities[0]];
        const modifiers = [...gaps[1]];
        while (modifiers.length > 0) {
            const interpretation = parseAddToTarget(
                parser,
                state,
                graph,
                modifiers,
                product
            );

            if (interpretation.score > best.score) {
                best = interpretation;
            }
    
            product.push(modifiers.shift()!);
        }
    }

    return best;
}

export function parseAddToImplicit(
    parser: Parser,
    state: State,
    graph: Graph,
    modification: Array<Token & Span>,
): Interpretation {
    // console.log(`Modifying`);
    // console.log(`  ${target.map(tokenToString).join('')}`);
    // console.log(`with`);
    // console.log(`  ${modification.map(tokenToString).join('')}`);

    let best = nop;
    // TODO: shouldn't this loop go in reverse order?
    for (const item of state.cart.items) {
        const interpretation = parseAddToItem(
            parser,
            state,
            graph,
            modification,
            { item, score: 1 }
        );
        if (interpretation.score > best.score) {
            best = interpretation;
        }
    }
    return best;
}

export function parseAddToTarget(
    parser: Parser,
    state: State,
    graph: Graph,
    modification: Array<Token & Span>,
    target: Array<Token & Span>
): Interpretation {
    // console.log(`Modifying`);
    // console.log(`  ${target.map(tokenToString).join('')}`);
    // console.log(`with`);
    // console.log(`  ${modification.map(tokenToString).join('')}`);

    const span = createSpan(target);
    let best = nop;
    for (const targetItem of targets(
        parser,
        state,
        graph,
        span
    )) {
        const interpretation = parseAddToItem(
            parser,
            state,
            graph,
            modification,
            targetItem
        );
        if (interpretation.score > best.score) {
            best = interpretation;
        }
    }
    return best;
}

export function parseAddToItem(
    parser: Parser,
    state: State,
    graph: Graph,
    modification: Array<Token & Span>,
    targetItem: HypotheticalItem
): Interpretation {
    if (targetItem.item) {
        // Get target's pid from it's key
        // Create segment
        //   left: empty
        //   entity: pid instead of token
        //   right: modifications
        // Build item
        // Copy options from builder
        // Change attributes from builder

        // console.log(`  target: ${targetItem.item.key} (uid=${targetItem.item!.uid})`);
        const pid: PID = AttributeInfo.pidFromKey(targetItem.item.key);
        const segment: Segment = {
            left: [],
            entity: pid,
            // TODO: remove type assertion to GapToken.
            right: modification as GapToken[]
        };
        const builder = new ModificationBuilder(
            parser,
            targetItem.item,
            modification as GapToken[]
        );

        // const builder = new EntityBuilder(
        //     parser,
        //     segment
        // );
        // let item = targetItem.item;
        const modified = builder.getItem();

        // Score for the entire intrepretation is the sum of the scores of the
        // target item and the modifications from the builder. Subtract one
        // because there is no token for the entity in the modifications.
        const score = targetItem.score + builder.getScore() - 1;

        const interpretation: Interpretation = {
            score,
            items: [],
            action: (state: State): State => {
                const cart = parser.cartOps.replaceInCart(state.cart, modified);
                return {...state, cart};
            }

        // const interpretation: Interpretation = {
        //     score,
        //     items: [],
        //     action: (state: State): State => {
        //         // Copy over each of the new children.
        //         for (const option of modified.children) {
        //             item = parser.cartOps.addToItemWithReplacement(item, option);
        //         }
        //         const cart = parser.cartOps.replaceInCart(state.cart, item);
        //         return {...state, cart};
        //     }
        };
        return interpretation;
    }
    return nop;
}

function parseReplace1(
    parser: Parser,
    state: State,
    graph: Graph,
    partTokens: Array<Token & Span>,
): Interpretation {
    // Break into sequence of gaps and the entities that separate them.
    const {entities, gaps} = splitOnEntities(partTokens as Array<SequenceToken & Span>);

    if (entities.length !== 2) {
        // TODO: are there scenarios like "I made x y a z" or "I made x a y and z"?
        // We need a target and a replaement.
        // Return an empty interpretation.
        return nop; 
    }

    // Enumerate all combinations of split points in gaps.
    const lengths: number[] = gaps.map(x => x.length);

    for (const splits of enumerateSplits(lengths)) {
        // Construct the sequence of Segments associated with a particular
        // choice of split points.
        const segments: Segment[] = entities.map( (entity: EntityToken, index: number) => ({
            left: gaps[index].slice(splits[index]),
            entity: entity.pid,
            right: gaps[index + 1].slice(0, splits[index + 1]),
        }));

        if (segments.length === 2) {
            const target = [...gaps[0], entities[0], ...gaps[1]];
            const replacement = parserBuildItemFromSegment(parser, segments[1]);
            return parseReplaceTargetWithItem(
                parser,
                state,
                graph,
                target,
                replacement
            );
        }
    }

    return nop;
}

function parseReplaceTarget(
    parser: Parser,
    state: State,
    graph: Graph,
    target: Array<Token & Span>,
    replacementTokens: Array<Token & Span>
): Interpretation {
    const replacement = parserBuildItemFromTokens(parser, replacementTokens);
    return parseReplaceTargetWithItem(
        parser,
        state,
        graph,
        target,
        replacement
    );
}

function parseReplaceTargetWithItem(
    parser: Parser,
    state: State,
    graph: Graph,
    target: Array<Token & Span>,
    replacement: HypotheticalItem
): Interpretation {    
    let best = nop;
    const span = createSpan(target);
    if (replacement.score > 0 && replacement.item) {
        for (const targetItem of targets(
            parser,
            state,
            graph,
            span
        )) {
            const interpretation = parseReplaceItem(
                parser,
                state,
                graph,
                targetItem,
                replacement,
            );
            if (interpretation.score > best.score) {
                best = interpretation;
            }
        }
    }
    return best;
}

function parseReplaceItem(
    parser: Parser,
    state: State,
    graph: Graph,
    target: HypotheticalItem,
    replacement: HypotheticalItem
): Interpretation {
    if (target.item && replacement.item) {
        const item = {...replacement.item, uid: target.item.uid};
        const cart = parser.cartOps.replaceInCart(state.cart, item);
        return {
            score: target.score + replacement.score,
            items: [],
            action: (state: State): State => {
                return {...state, cart};
            }
        };
    }

    return nop;
}

function parseReplaceImplicit(
    parser: Parser,
    state: State,
    graph: Graph,
    replacementTokens: Array<SequenceToken & Span>
): Interpretation {
    const items = state.cart.items;
    if (items.length > 0) {
        const replacement = parserBuildItemFromTokens(parser, replacementTokens);
        const target: HypotheticalItem = {
            item: items[items.length - 1],
            score: 1
        };
        return parseReplaceItem(
            parser,
            state,
            graph,
            target,
            replacement
        );
    }

    return nop;
}

function parserBuildItemFromTokens(
    parser: Parser,
    tokens: Array<Token & Span>
): HypotheticalItem {
    const {entities, gaps} = splitOnEntities(tokens as Array<SequenceToken & Span>);
    if (gaps.length === 2 && entities.length === 1) {
        const segment: Segment = {
            left: gaps[0],
            entity: entities[0].pid,
            right: gaps[1]
        };
        return parserBuildItemFromSegment(parser, segment);
        // const builder = new EntityBuilder(parser, segment);
        // return {
        //     item: builder.getItem(),
        //     score: builder.getScore()
        // };
    }

    return { item: undefined, score: 0 };
}

function parserBuildItemFromSegment(
    parser: Parser,
    segment: Segment
): HypotheticalItem {
    const builder = new EntityBuilder(parser, segment);
    return {
        item: builder.getItem(),
        score: builder.getScore()
    };
}

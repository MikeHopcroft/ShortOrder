import { State } from 'prix-fixe';

import { Graph, Token } from 'token-flow';

import { segmentLength } from './add';

import {
    createSpan,
    EntityToken,
    MODIFY_ITEM,
    PREPOSITION,
    PROLOGUE,
    Span,
} from '../lexer';

import {
    EntityBuilder,
    ModificationBuilder,
    ReplacementBuilder
} from './entity_builder';

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
import { productTargets } from './target';
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

    // // Without check for preposition, following tests fail:
    // //   52: OK => FAILED(1)    "change that cappuccino to decaf"
    // //   56: OK => FAILED(1)    "change that latte to a tall"
    // //   57: OK => FAILED(1)    "change that cappuccino to a decaf"
    // //   61.1: OK => FAILED(3)  "make that latte a cappuccino"
    // //   62: OK => FAILED(3)    "change that latte to a half caf espresso"
    // //   1010: OK => FAILED(2)  "make that latte decaf"
    // // With check for prepositions, following test fails:
    // //   61: OK => FAILED(3)    "actually make that a cappuccino"
    // if (tokens.peek(0).type === PREPOSITION) {
    //     tokens.take(1);
    // }

    if (!tokens.atEOS()) {
        if (
            tokens.startsWith([PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_0]) ||
            tokens.startsWith([PREPOSITION, PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_0])
        ) {
            if (tokens.peek(0).type === PREPOSITION) {
                tokens.take(1);
            }

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
                target.tokens,
                false
            );
        } else if (tokens.startsWith([PREPOSITION, PRODUCT_PARTS_0])) {
            // * (made,changed) [that] (into,to,with) [a] P0
            const modification = tokens.peek(1) as ProductToken0 & Span;
            tokens.take(2);
            return parseAddToImplicit(
                parser,
                state,
                graph,
                modification.tokens,
                false
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
                modification.tokens,
                false
            );
        } else if (
            tokens.startsWith([PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_1]) ||
            tokens.startsWith([PREPOSITION, PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_1])
        ) {
            if (tokens.peek(0).type === PREPOSITION) {
                tokens.take(1);
            }

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
        } else if (
            tokens.startsWith([PRODUCT_PARTS_N]) ||
            tokens.startsWith([PREPOSITION, PRODUCT_PARTS_N])
        ) {
            if (tokens.peek(0).type === PREPOSITION) {
                tokens.take(1);
            }

            // * (made,changed,replaced) [the,that,your] (into,to,with) [a] P1
            const parts = tokens.peek(0) as ProductToken1 & Span;
            tokens.take(1);
            return parseReplace1(
                parser,
                state,
                graph,
                parts.tokens
            );
        } else if (
            tokens.startsWith([PRODUCT_PARTS_1]) || false

            // Removing this clause gives
            //   1010: OK => FAILED(2)  "make that latte decaf"
            // The form in 1010 is ambiguous with 63.1 and 64.
            // tokens.startsWith([PREPOSITION, PRODUCT_PARTS_1])
            //
            // BETTER EXAMPLE:
            //   "make that a latte with vanilla"
            //   "make that latte with vanilla"
            // In the above examples, a single word ("a") makes
            // a huge difference in meaning. In addition, the context
            // of what is in the cart impacts the meaning. Consider
            // these additional phrases in the context of various carts:
            //
            //   "make that five lattes with vanilla"
            //   "make that a tall latte with vanilla"
            //
            // cart with
            //
            //   1 grande latte
            //   1 doppio espresso
            //
            // vs
            //
            //   1 grande latte with vanilla
            //   1 doppio espresso
            //
            // vs
            //
            //   5 grande lattes
            //   1 doppio espresso
            //
            //   1 grande latte with vanilla
            //   1 grande latte
            //
            // One heuristic for resolving this ambiguity might be to favor
            // the interpretation with the lowest edit distance, in the case
            // where two interpretations have the same score.
        ) {
            // if (tokens.peek(0).type === PREPOSITION) {
            //     tokens.take(1);
            // }

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
            // REMOVING this case introduces the following failures:
            // 63.1: OK => FAILED(4)    "change that to a tall iced latte"
            // 64: OK => FAILED(4)      "change that to a tall iced latte"

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
            // Don't take the token here. The PROLOGUE and MODIFY_ITEM were
            // already taken at the beginning on the function.
            // tokens.take(1);
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
                product,
                false
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
    combineQuantities: boolean
): Interpretation {
    // console.log(`Modifying`);
    // console.log(`  ${target.map(tokenToString).join('')}`);
    // console.log(`with`);
    // console.log(`  ${modification.map(tokenToString).join('')}`);

    let best = nop;

    // Search in reverse order to favor more recently added items.
    for (let i = state.cart.items.length - 1; i >= 0; --i) {
        const item = state.cart.items[i];
        const interpretation = parseAddToItem(
            parser,
            modification,
            {
                item,
                score: 1,
                tokenCount: modification.length
            },
            combineQuantities
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
    target: Array<Token & Span>,
    combineQuantities: boolean
): Interpretation {
    // console.log(`Modifying`);
    // console.log(`  ${target.map(tokenToString).join('')}`);
    // console.log(`with`);
    // console.log(`  ${modification.map(tokenToString).join('')}`);

    const span = createSpan(target);
    let best = nop;
    for (const targetItem of productTargets(
        parser,
        state,
        graph,
        span
    )) {
        const interpretation = parseAddToItem(
            parser,
            modification,
            targetItem,
            combineQuantities
        );
        if (interpretation.score > best.score) {
            best = interpretation;
        }
    }
    return best;
}

export function parseAddToItem(
    parser: Parser,
    modification: Array<Token & Span>,
    targetItem: HypotheticalItem,
    combineQuantities: boolean
): Interpretation {
    if (targetItem.item) {
        // console.log(`  target: ${targetItem.item.key} (uid=${targetItem.item!.uid})`);
        const builder = new ModificationBuilder(
            parser,
            targetItem.item,
            modification as GapToken[],
            combineQuantities
        );

        const modified = builder.getItem();

        // Score for the entire intrepretation is the sum of the scores of the
        // target item and the modifications from the builder. Subtract one
        // because there is no token for the entity in the modifications.
        const score = targetItem.score + builder.getScore() - 1;

        const interpretation: Interpretation = {
            score,
            tokenCount2: modification.length,
            action: (state: State): State => {
                const cart = parser.cartOps.replaceInCart(state.cart, modified);
                return {...state, cart};
            }
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

    let best = nop;
    for (const splits of enumerateSplits(lengths)) {
        // Construct the sequence of Segments associated with a particular
        // choice of split points.
        const segments: Segment[] = entities.map( (entity: EntityToken, index: number) => ({
            left: gaps[index].slice(splits[index]),
            entity: entity.pid,
            right: gaps[index + 1].slice(0, splits[index + 1]),
        }));

        if (segments.length === 2) {
            const targetTokens = [
                ...segments[0].left,
                entities[0],
                ...segments[0].right
            ];
            const replacementTokens = [
                ...segments[1].left,
                entities[1],
                ...segments[1].right
            ];

            const interpretation = parseReplaceTarget(
                parser,
                state,
                graph,
                // TODO: remove type assertion
                targetTokens as Array<Token & Span>,
                replacementTokens as Array<Token & Span>
            );
            if (interpretation.score > best.score) {
                best = interpretation;
            }
        }
    }

    return best;
}

function parseReplaceTarget(
    parser: Parser,
    state: State,
    graph: Graph,
    targetTokens: Array<Token & Span>,
    replacementTokens: Array<Token & Span>
): Interpretation {
    let best = nop;
    const span = createSpan(targetTokens);
    for (const targetItem of productTargets(
        parser,
        state,
        graph,
        span
    )) {
        const interpretation = parseReplaceItemWithTokens(
            parser,
            state,
            graph,
            targetItem,
            replacementTokens,
        );
        if (interpretation.score > best.score) {
            best = interpretation;
        }
    }
    return best;
}

function parseReplaceItemWithTokens(
    parser: Parser,
    state: State,
    graph: Graph,
    target: HypotheticalItem,
    replacementTokens: Array<Token & Span>
): Interpretation {
    if (target.item) {
        const {entities, gaps} =
            splitOnEntities(replacementTokens as Array<SequenceToken & Span>);
        if (gaps.length === 2 && entities.length === 1) {
            const segment: Segment = {
                left: gaps[0],
                entity: entities[0].pid,
                right: gaps[1]
            };

            const builder = new ReplacementBuilder(
                parser,
                target.item,
                segment
            );
            return parseReplaceItem(
                parser,
                state,
                graph,
                target,
                {
                    item: builder.getItem(),
                    score: builder.getScore(),
                    tokenCount: target.tokenCount + replacementTokens.length
                }
            );
        }
    }

    return nop;
}


function parseReplaceItem(
    parser: Parser,
    state: State,
    graph: Graph,
    target: HypotheticalItem,
    replacement: HypotheticalItem
): Interpretation {
    if (target.item && replacement.item) {
        // If the replacement specifies children use them.
        // Otherwise keep the children from the target.
        const children =
            replacement.item.children.length > 0 ?
            replacement.item.children :
            target.item.children;
        const item = {
            ...replacement.item,
            children,
            uid: target.item.uid,
        };
        const cart = parser.cartOps.replaceInCart(state.cart, item);
        return {
            score: target.score + replacement.score,
            tokenCount2: target.tokenCount + replacement.tokenCount,
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
        const replacement = 
            parserBuildItemFromTokens(parser, replacementTokens);
        const target: HypotheticalItem = {
            item: items[items.length - 1],
            score: 1,
            tokenCount: 0
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
    }

    return { item: undefined, tokenCount: 0, score: 0 };
}

function parserBuildItemFromSegment(
    parser: Parser,
    segment: Segment
): HypotheticalItem {
    const builder = new EntityBuilder(parser, segment);
    return {
        item: builder.getItem(),
        score: builder.getScore(),
        tokenCount: segmentLength(segment)
    };
}

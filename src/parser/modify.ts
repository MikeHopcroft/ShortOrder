import {
    AttributeInfo,
    PID, 
    State,
} from 'prix-fixe';

import { Graph, Token } from 'token-flow';

import {
    createSpan,
    MODIFY_ITEM,
    PREPOSITION,
    PROLOGUE,
    Span,
    tokenToString,
} from '../lexer';

import { EntityBuilder } from './entity_builder';

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
import { splitOnEntities } from './parser_utilities';
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
        const builder = new EntityBuilder(
            segment,
            parser,
            false,
            false
        );
        let item = targetItem.item;
        const modified = builder.getItem();

        const interpretation: Interpretation = {
            score: targetItem.score,
            items: [],
            action: (state: State): State => {
                // Copy over each of the new children.
                for (const option of modified.children) {
                    item = parser.cartOps.addToItemWithReplacement(item, option);
                }
                const cart = parser.cartOps.replaceInCart(state.cart, item);
                return {...state, cart};
            }
        };
        return interpretation;
    }
    return nop;
}

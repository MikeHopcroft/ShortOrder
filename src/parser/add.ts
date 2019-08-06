import { ItemInstance, State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    ADD_TO_ORDER,
    EntityToken,
    Span,
    PREPOSITION,
    PROLOGUE,
    WEAK_ADD,
} from '../lexer';

import { EntityBuilder } from './entity_builder';

import {
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

import {
    parseAddToTarget,
    parseAddToImplicit,
} from './modify';

import { Parser } from './parser';

import {
    enumerateSplits,
    splitOnEntities,
} from './parser_utilities';

import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product add operation.
//
// Assumes that `tokens` starts with one of the following:
//     [PROLOGUE] ADD_TO_ORDER (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
//     PROLOGUE WEAK_ORDER (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
//     [PROLOGUE] ADD_TO_ORDER PRODUCT_PARTS_0 PREPOSITION PRODUCT_PARTS_1 [EPILOGUE]
//     PROLOGUE WEAK_ORDER PRODUCT_PARTS_0 PREPOSITION PRODUCT_PARTS_1 [EPILOGUE]
export function processAdd(
    parser: Parser,
    state: State,
    graph: Graph,
    tokens: TokenSequence<Token & Span>
): Interpretation {
    if (tokens.peek(0).type === PROLOGUE) {
        tokens.take(1);
    }

    if (tokens.peek(0).type === WEAK_ADD) {
        tokens.take(1);
    } else if (tokens.peek(0).type === ADD_TO_ORDER) {
        tokens.take(1);
    }

    if (tokens.startsWith([PRODUCT_PARTS_0, PREPOSITION, PRODUCT_PARTS_1])) {
        // We're adding modifications to an item that is already in the cart.
        const target = tokens.peek(2) as ProductToken1 & Span;
        const modification = tokens.peek(0) as ProductToken0 & Span;
        tokens.take(3);
        return parseAddToTarget(parser, state, graph, modification.tokens, target.tokens);
    } else if (tokens.startsWith([PRODUCT_PARTS_0, PREPOSITION])) {
        const modification = tokens.peek(0) as ProductToken0 & Span;
        tokens.take(2);
        return parseAddToImplicit(parser, state, graph, modification.tokens);
    } else if (
        // We're adding new items to the cart.
        tokens.startsWith([PRODUCT_PARTS_1]) ||
        tokens.startsWith([PRODUCT_PARTS_N])
    ) {
        const token = tokens.peek(0) as ProductToken & Span;
        tokens.take(1);
        return parseAdd(parser, token.tokens);
    } else if (tokens.startsWith([PRODUCT_PARTS_0])) {
        // We're adding options to an implicit item already in the cart.
        const modification = tokens.peek(0) as ProductToken0 & Span;
        tokens.take(1);
        return parseAddToImplicit(parser, state, graph, modification.tokens);
    }

    return nop;
}

// Find the best Interpretation for an array of SequenceTokens representing
// the addition of one or more products.
// TODO: stop exporting this function - it is exported for unit testing.
export function parseAdd(
    parser: Parser,
    tokens: Array<SequenceToken & Span>
): Interpretation {
    const interpretations: Interpretation[] = [];

    // Break into sequence of gaps and the entities that separate them.
    const {entities, gaps} = splitOnEntities(tokens);

    if (entities.length < 1) {
        // There's no entity here.
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

        // Parse these segments to produce an interpretation for this
        // choice of split points.
        // TODO: BUGBUG: following line modifies segments[X].left, right
        // TODO: BUGBUG: TokenSequence shouldn't modifiy tokens[].
        const interpretation = interpretSegmentArray(parser, segments);

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
        return nop; 
    }
}

function interpretSegmentArray(parser: Parser, segments: Segment[]): Interpretation {
    let score = 0;
    const items: ItemInstance[] = [];
    for (const segment of segments) {
        const x = interpretOneSegment(parser, segment);
        if (x.item !== undefined) {
            score += x.score;
            items.push(x.item);
        }
    }

    const action = (state: State): State => {
        let updated = state.cart;
        for (const item of items) {
            updated = parser.cartOps.addToCart(updated, item);
        }

        return {...state, cart: updated};
    };

    return {score, items, action};
}

function interpretOneSegment(
    parser: Parser,
    segment: Segment
): HypotheticalItem {
    const builder = new EntityBuilder(
        segment,
        parser,
        false,
        false
    );

    const item = builder.getItem();
    if (parser.catalog.hasKey(item.key)) {
        return {
            score: builder.getScore(),
            item: builder.getItem()
        };
    } else {
        return {
            score: 0,
            item: undefined
        };
    }
}

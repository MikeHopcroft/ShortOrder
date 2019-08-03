import { ItemInstance, State } from 'prix-fixe';
import { Token } from 'token-flow';

import {
    ADD_TO_ORDER,
    EntityToken,
    Span,
    PROLOGUE,
    WEAK_ADD
} from '../lexer';

import { EntityBuilder } from './entity_builder';

import {
    HypotheticalItem,
    Interpretation,
    nop,
    Segment,
    SequenceToken
} from './interfaces';

import { Parser } from './parser';

import {
    enumerateSplits,
    splitOnEntities,
} from './parser_utilities';

import { takeActiveTokens } from './root';
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product add operation.
//
// Assumes that `tokens` starts with one of the following:
//     [PROLOGUE] ADD_TO_ORDER PRODUCT_PARTS [EPILOGUE]
//     PROLOGUE WEAK_ORDER PRODUCT_PARTS [EPILOGUE]
export function processAdd(
    parser: Parser,
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

    const active = takeActiveTokens(parser, tokens);
    return parseAdd(parser, active);
}

// Find the best Interpretation for an array of SequenceTokens representing
// the addition of one or more products.
// TODO: stop exporting this function - it is exported for unit testing.
export function parseAdd(
    parser: Parser,
    tokens: SequenceToken[]
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
            entity,
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
        parser.cartOps,
        parser.attributes,
        parser.rules,
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

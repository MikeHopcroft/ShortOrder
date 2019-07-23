import { ItemInstance, State } from 'prix-fixe';

import { EntityToken } from '../lexer';

import { EntityBuilder } from './entity_builder';

import {
    HypotheticalItem,
    Interpretation,
    Segment,
    SequenceToken
} from './interfaces';

import { Parser } from './parser';

import {
    enumerateSplits,
    nop,
    splitOnEntities,
} from './parser_utilities';

export function parseAdd(
    parser: Parser,
    tokens: SequenceToken[]
): Interpretation {
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
        const interpretation = interpretSegmentArray(parser, segments);

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
        parser.rules
    );
    return {
        score: builder.getScore(),
        item: builder.getItem()
    };
}

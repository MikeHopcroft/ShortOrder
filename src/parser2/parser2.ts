import {
    AttributeInfo,
    ICartOps,
    ItemInstance, 
    RuleChecker
} from 'prix-fixe';

import {
    EntityToken,
} from '../unified';

import { EntityBuilder } from './entity_builder';

import {
    HypotheticalItem,
    Interpretation,
    Segment,
    SequenceToken
} from './interfaces';

import {
    enumerateSplits,
    splitOnEntities,
} from './parser_utilities';

class Parser2 {
    private readonly cartOps: ICartOps;
    private readonly info: AttributeInfo;
    private readonly rules: RuleChecker;

    constructor(cartOps: ICartOps, info: AttributeInfo, rules: RuleChecker) {
        this.cartOps = cartOps;
        this.info = info;
        this.rules = rules;
    }

    findBestInterpretation(tokens: SequenceToken[]): Interpretation {
        const interpretations: Interpretation[] = [];

        // Break into sequence of gaps and the entities that separate them.
        const {entities, gaps} = splitOnEntities(tokens);

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
            const interpretation = this.interpretSegmentArray(segments);
            interpretations.push(interpretation);
        }

        if (interpretations.length > 0) {
            // We found at least one interpretation.
            // Sort interpretations by decreasing score.
            // TODO: verify sort order. 
            interpretations.sort((a, b) => a.score - b.score);

            // Return the highest scoring interpretation.
            return interpretations[0];
        } else {
            // We didn't find any interpretations.
            // Return an empty interpretation.
            return {score: 0, items: []}; 
        }
    }

    interpretSegmentArray(segments: Segment[]): Interpretation {
        let score = 0;
        const items: ItemInstance[] = [];
        for (const segment of segments) {
            const x = this.interpretOneSegment(segment);
            if (x.item !== undefined) {
                score += x.score;
                items.push(x.item);
            }
        }
        return {score, items};
    }

    interpretOneSegment = (segment: Segment): HypotheticalItem => {
        const builder = new EntityBuilder(segment, this.cartOps, this.info, this.rules);
        return {
            score: builder.getScore(),
            item: builder.getItem()
        };
    }
}

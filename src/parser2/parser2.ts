import {
    AttributeInfo,
    ICartOps,
    ItemInstance, 
    RuleChecker
} from 'prix-fixe';

import {
    ADD_TO_ORDER,
    EntityToken,
    tokenToString,
    LexicalAnalyzer
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


function printSegment(segment: Segment) {
    const left = segment.left.map(tokenToString).join('');
    const entity = tokenToString(segment.entity);
    const right = segment.right.map(tokenToString).join('');

    console.log('  Segment');
    console.log(`    left: ${left}`);
    console.log(`    entity: ${entity}`);
    console.log(`    right: ${right}`);
}

export class Parser2 {
    private readonly cartOps: ICartOps;
    private readonly info: AttributeInfo;
    private readonly rules: RuleChecker;

    constructor(cartOps: ICartOps, info: AttributeInfo, rules: RuleChecker) {
        this.cartOps = cartOps;
        this.info = info;
        this.rules = rules;
    }

    parseRoot(lexer: LexicalAnalyzer, text: string): Interpretation {
        const tokenizations = [...lexer.tokenizations(text)];
        const interpretations: Interpretation[] = [];
        for (const tokens of tokenizations) {
            // TODO: HACK: BUGBUG:
            // TODO: Remove this code once the parser handles intents.
            if (tokens.length > 0 && tokens[0].type === ADD_TO_ORDER) {
                tokens.shift();
            }
            interpretations.push(
                this.findBestInterpretation(tokens as SequenceToken[]));
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
            return {score: 0, items: []}; 
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
            return {score: 0, items: []}; 
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
        return {score, items};
    }

    private interpretOneSegment = (segment: Segment): HypotheticalItem => {
        const builder = new EntityBuilder(segment, this.cartOps, this.info, this.rules);
        return {
            score: builder.getScore(),
            item: builder.getItem()
        };
    }
}

import {
    AID,
    AttributeInfo,
    DID,
    Dimension,
    ICatalog,
} from 'prix-fixe';

import {
    generateAliases
} from 'token-flow';

import {
    patternFromExpression
} from '../lexer';

import {
    AttributeX,
    EITHER,
    Position
} from './fuzzer';

import {
    Random
} from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// AttributeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeGenerator {
    private readonly attributes = new Map<AID, AttributeX[]>();

    constructor(
        attributeInfo: AttributeInfo,
        positions: Map<AID, Position>,
    ) {
        const hack2 = attributeInfo['dimensionIdToDimension'] as Map<DID, Dimension>;
        for (const dimension of hack2.values()) {
            for (const attribute of dimension.attributes) {
                const ax: AttributeX[] = [];
                if (!attribute.hidden) {
                    let position: Position = EITHER;
                    if (positions.has(attribute.aid)) {
                        position = positions.get(attribute.aid)!;
                    }

                    for (const alias of attribute.aliases) {
                        const pattern = patternFromExpression(alias);
                        for (const text of generateAliases(pattern)) {
                            ax.push(new AttributeX(attribute.aid, text, position));
                        }
                    }
                }
                this.attributes.set(attribute.aid, ax);
            }
        }
    }

    get(aids: AID[], random: Random): AttributeX[] {
        const ax: AttributeX[] = [];
        for (const aid of aids) {
            const choices = this.attributes.get(aid);
            if (choices && choices.length > 0) {
                ax.push(random.randomChoice(choices));
            }
        }
        return ax;
    }
}

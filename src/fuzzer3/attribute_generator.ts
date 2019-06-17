import * as pluralize from 'pluralize';

import {
    AID,
    AttributeDescription,
    AttributeInfo,
    DID,
    Dimension,
    ICatalog,
    PID,
    Tensor,
    TID
} from 'prix-fixe';

import {
    generateAliases
} from 'token-flow';

import {
    patternFromExpression,
} from '../unified';

import {
    AttributeX,
    EITHER,
    Position
} from './fuzzer';

import {
    aliasesFromOneItem,
    Random
} from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// AttributeCombinations
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeCombinations {
    private readonly info: AttributeInfo;
    private readonly catalog: ICatalog;
    private readonly positions: Map<AID, Position>;

    private readonly tensor: Tensor;

    private readonly dimensionIdToAttributeId = new Map<DID, AID>();
    private readonly attributes: AttributeX[] = [];

    static getCombinations(
        attributeInfo: AttributeInfo,
        catalog: ICatalog,
        positions: Map<AID, Position>,
        tensor: Tensor
    ): AttributeX[][] {
        const generator = new AttributeCombinations(
            attributeInfo,
            catalog,
            positions,
            tensor
        );

        return [...generator.combinations()];
    }

    private constructor(
        attributeInfo: AttributeInfo,
        catalog: ICatalog,
        positions: Map<AID, Position>,
        tensor: Tensor
    ) {
        this.info = attributeInfo;
        this.catalog = catalog;
        this.positions = positions;
        this.tensor = tensor;
    }

    private *combinations(): IterableIterator<AttributeX[]> {
        yield* this.combinationsRecursion(0);
    }

    private *combinationsRecursion(d: number): IterableIterator<AttributeX[]> {
        const dimension = this.tensor.dimensions[d];

        for (const attribute of dimension.attributes) {
            // TODO: include all aliases for attributes?
            let position: Position = EITHER;
            if (this.positions.has(attribute.aid)) {
                position = this.positions.get(attribute.aid)!;
            }
            const ax = new AttributeX(attribute.aid, attribute.aliases[0], position);
            if (attribute.hidden !== true) {
                this.attributes.push(ax);
            }
            this.dimensionIdToAttributeId.set(dimension.did, attribute.aid);

            if (d === this.tensor.dimensions.length - 1) {
                yield [...this.attributes];
            }
            else {
                yield* this.combinationsRecursion(d + 1);
            }

            if (attribute.hidden !== true) {
                this.attributes.pop();
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// AttributeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeGenerator {
    private readonly combinations = new Map<TID, AttributeX[][]>();

    constructor(
        attributeInfo: AttributeInfo,
        catalog: ICatalog,
        positions: Map<AID, Position>,
    ) {
        // TODO: remove this hack once we have a version of prix-fixe that
        // can enumerate TIDs.
        const hack = attributeInfo['tensorIdToTensor'] as Map<TID, Tensor>;
        for (const [tid, tensor] of hack.entries()) {
            const combinations = AttributeCombinations.getCombinations(
                attributeInfo,
                catalog,
                positions,
                tensor
            );
            this.combinations.set(tid, combinations);
        }
    }

    randomCombination(tid: TID, random: Random): AttributeX[] {
        const combinations = this.combinations.get(tid)!;
        return random.randomChoice(combinations);
    }
}


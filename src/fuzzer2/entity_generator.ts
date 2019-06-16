import * as pluralize from 'pluralize';
import { PID } from 'prix-fixe';
import { generateAliases } from 'token-flow';

import { AttributeInfo, AttributeItem, Dimension, Matrix } from '../attributes';
import { Catalog } from '../catalog';
import { patternFromExpression } from '../unified';

import { Generator } from './generator';
import {
    BasicInstance,
    CreateAttributeInstance,
    CreateEntityInstance,
    EntityInstance,
    Quantity
} from './instances';
import { aliasesFromOneItem } from './utilities';


///////////////////////////////////////////////////////////////////////////////
//
// EntityGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class EntityGenerator implements Generator<BasicInstance> {
    private readonly info: AttributeInfo;
    private readonly catalog: Catalog;
    private readonly entityId: PID;
    private readonly quantifiers: Quantity[];

    private readonly matrix: Matrix;

    private readonly dimensionIdToAttributeId = new Map<PID, PID>();
    private readonly attributes: AttributeItem[] = [];

    private readonly instances: BasicInstance[][];

    constructor(attributeInfo: AttributeInfo, catalog: Catalog, entityId: PID, quantifiers: Quantity[]) {
        this.info = attributeInfo;
        this.catalog = catalog;
        this.entityId = entityId;

        // TODO: refactor so that all OptionGenerators can share expanded aliases.
        this.quantifiers = [];
        for (const quantifier of quantifiers) {
            const expression = quantifier.text;
            const pattern = patternFromExpression(expression);
            for (const text of generateAliases(pattern)) {
                this.quantifiers.push({ text, value: quantifier.value });
            }
        }

        const matrix = this.info.getMatrixForEntity(this.entityId);
        if (!matrix) {
            const message = `Product ${entityId} does not have a matrix.`;
            throw TypeError(message);
        }
        this.matrix = matrix;

        this.instances = [...this.createInstances()];
    }

    private pushAttribute(dimension: Dimension, attribute: AttributeItem) {
        if (attribute.hidden !== true) {
            this.attributes.push(attribute);
        }
        this.dimensionIdToAttributeId.set(dimension.id, attribute.pid);
    }

    private popAttribute(dimension: Dimension, attribute: AttributeItem) {
        if (attribute.hidden !== true) {
            this.attributes.pop();
        }
    }

    private getPID(): PID | undefined {
        const key = this.matrix.getKey(this.entityId, this.dimensionIdToAttributeId, this.info);
        const pid = this.info.getPID(key);
        return pid;
    }

    private *entityVersions(): IterableIterator<EntityInstance> {
        const pid = this.getPID();
        if (pid === undefined) {
            return;
        }

        const item = this.catalog.get(this.entityId);
        for (let alias of aliasesFromOneItem(item)) {
            for (const quantity of this.quantifiers) {
                if (quantity.value > 1) {
                    alias = pluralize(alias);
                }
                yield CreateEntityInstance(pid, alias, quantity);
            }
        }
    }

    private *createInstances(): IterableIterator<BasicInstance[]> {
        yield* this.createInstancesRecursion(0);
    }

    private *createInstancesRecursion(d: number): IterableIterator<BasicInstance[]> {
        const dimension = this.matrix.dimensions[d];

        for (const attribute of dimension.attributes) {
            this.pushAttribute(dimension, attribute);

            if (d === this.matrix.dimensions.length - 1) {
                const pid = this.getPID();
                if (pid !== undefined) {
                    const attributes = this.attributes.map(a => CreateAttributeInstance(a.pid, a.aliases[0]));
                    for (const entity of this.entityVersions()) {
                        yield [...attributes, entity];
                    }
                }
            }
            else {
                yield* this.createInstancesRecursion(d + 1);
            }

            this.popAttribute(dimension, attribute);
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): BasicInstance[] {
        return this.instances[id];
    }
}

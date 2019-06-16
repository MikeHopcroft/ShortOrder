import * as pluralize from 'pluralize';
import {
    AID,
    AttributeDescription,
    AttributeInfo,
    DID,
    Dimension,
    DimensionAndTensorDescription,
    ICatalog,
    Key,
    PID,
    Tensor
} from 'prix-fixe';

// TODO: can we get this from ./aliasGenerator
import { generateAliases } from 'token-flow';

// import { AttributeItem, Dimension, Matrix } from '../attributes';
// import { Catalog } from '../catalog';
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
    private readonly catalog: ICatalog;
    private readonly entityId: PID;
    private readonly quantifiers: Quantity[];

    private readonly matrix: Tensor;

    private readonly dimensionIdToAttributeId = new Map<DID, AID>();
    private readonly attributes: AttributeDescription[] = [];

    private readonly instances: BasicInstance[][];

    constructor(attributeInfo: AttributeInfo, catalog: ICatalog, entityId: PID, quantifiers: Quantity[]) {
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

        const tensor = this.info.getTensorForEntity(this.entityId);
        // if (!tensor) {
        //     const message = `Product ${entityId} does not have a matrix.`;
        //     throw TypeError(message);
        // }
        this.matrix = tensor;

        this.instances = [...this.createInstances()];
    }

    private pushAttribute(dimension: Dimension, attribute: AttributeDescription) {
        if (attribute.hidden !== true) {
            this.attributes.push(attribute);
        }
        this.dimensionIdToAttributeId.set(dimension.did, attribute.aid);
    }

    private popAttribute(dimension: Dimension, attribute: AttributeDescription) {
        if (attribute.hidden !== true) {
            this.attributes.pop();
        }
    }

    private getKey(): Key {
        const key = this.info.getKey(this.entityId, this.dimensionIdToAttributeId);
        return key;
    }

    private *entityVersions(): IterableIterator<EntityInstance> {
        // const pid = this.getPID();
        // if (pid === undefined) {
        //     return;
        // }

        // const item = this.catalog.get(this.entityId);
        const item = this.catalog.getGeneric(this.entityId);
        for (let alias of aliasesFromOneItem(item)) {
            for (const quantity of this.quantifiers) {
                if (quantity.value > 1) {
                    alias = pluralize(alias);
                }
                yield CreateEntityInstance(this.getKey(), alias, quantity);
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
                const pid = this.getKey();

                // TODO: include all aliases for attributes?
                const attributes = this.attributes.map(a => CreateAttributeInstance(a.aid, a.aliases[0]));
                for (const entity of this.entityVersions()) {
                    yield [...attributes, entity];
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

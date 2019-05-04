import { PID } from 'token-flow';

import { AttributeInfo, Attributes } from '../attributes';
import { Catalog } from '../catalog';
import { AnyInstance, Quantity } from '../fuzzer';

import { AliasGenerator } from './alias_generator';
import { Generator } from './generator';
import { EntityGenerator } from './entity_generator';
import { ModifierGenerator } from './modifier_generator';
import { OptionGenerator } from './option_generator';
import { ProductGenerator } from './product_generator';
import { factorial, permutation, Random } from './utilities';



///////////////////////////////////////////////////////////////////////////////
//
// Renderers
//
///////////////////////////////////////////////////////////////////////////////
// function renderAsTestCase(instanes: AnyInstance[]): TestCase {
// }


///////////////////////////////////////////////////////////////////////////////
//
// RandomProducts
//
///////////////////////////////////////////////////////////////////////////////
export class RandomProducts {
    private readonly random: Random;

    private readonly entities: EntityGenerator[] = [];
    private readonly modifiers: ModifierGenerator[] = [];
    private readonly options: OptionGenerator[] = [];

    constructor(
        catalog: Catalog,
        attributeInfo: AttributeInfo,
        attributes: Attributes,
        entityQuantities: Quantity[],
        optionIds: PID[],
        optionQuantities: Quantity[],
        random: Random
    ) {
        this.random = random;

        for (const [pid, item] of catalog.map.entries()) {
            if (item.matrix !== undefined) {
                this.entities.push(new EntityGenerator(attributeInfo, catalog, item.pid, entityQuantities));
            }
        }

        for (const dimension of attributes.dimensions) {
            // Hack to determine if dimension is a modifier.
            if (dimension.items[0].sku !== undefined) {
                const d = attributeInfo.getDimension(dimension.did);
                if (d === undefined) {
                    const message = `unknown did ${dimension.did}`;
                    throw TypeError(message);
                }
                this.modifiers.push(new ModifierGenerator(d));
            }
        }

        for (const pid of optionIds) {
            this.options.push(new OptionGenerator(catalog, pid, optionQuantities));
        }
    }

    oneProduct(): AnyInstance[] {
        const entity = this.random.randomChoice(this.entities);
        const modifier = this.random.randomChoice(this.modifiers);
        const option = this.random.randomChoice(this.options);

        const product = new ProductGenerator(entity, modifier, option);

        return this.random.randomInstanceSequence(product);
    }

    *products(): IterableIterator<AnyInstance[]> {
        while (true) {
            yield this.oneProduct();
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// RandomOrders
//
///////////////////////////////////////////////////////////////////////////////
export class RandomOrders {
    private readonly prologues: Generator;
    private readonly products: RandomProducts;
    private readonly epilogues: Generator;

    private readonly random: Random;

    constructor(prologueAliases: string[], products: RandomProducts, epilogueAliases: string[]) {
        this.prologues = new AliasGenerator(prologueAliases);
        this.products = products;
        this.epilogues = new AliasGenerator(epilogueAliases);

        this.random = new Random('seed1');
    }

    *orders(): IterableIterator<AnyInstance[]> {
        while (true) {
                const product = this.products.oneProduct();
                const permutedProduct = ProductGenerator.permute(product, this.random);
                const completedProduct = ProductGenerator.complete(permutedProduct);
            yield [
                ...this.random.randomInstanceSequence(this.prologues),
                ...completedProduct,
                ...this.random.randomInstanceSequence(this.epilogues),
            ];
        }
    }
}

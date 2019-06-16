import { PID } from 'prix-fixe';

import { AttributeInfo, Attributes } from '../attributes';
import { Catalog } from '../catalog';
import { BasicInstance, Quantity } from '../fuzzer2';

import { AliasGenerator } from './alias_generator';
import { Generator } from './generator';
import {
    ProductInstance,
    CreateProductInstance,
    WordInstance,
    WordOrProductInstance,
    CreateWordInstance
} from './instances';
import { EntityGenerator } from './entity_generator';
import { ModifierGenerator } from './modifier_generator';
import { OptionGenerator } from './option_generator';
import { ProductGenerator } from './product_generator';
import { Random } from './utilities';


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

    oneProduct(): BasicInstance[] {
        const entity = this.random.randomChoice(this.entities);
        const modifier = this.random.randomChoice(this.modifiers);
        const option = this.random.randomChoice(this.options);

        const product = new ProductGenerator(entity, modifier, option);

        return this.random.randomInstanceSequence(product);
    }

    onePermutedProduct(): ProductInstance {
        const product = this.oneProduct();
        const permutedProduct = ProductGenerator.permute(product, this.random);
        const completedProduct = ProductGenerator.complete(permutedProduct);
        const productInstance = CreateProductInstance(completedProduct);
        return productInstance;
    }

    *products(): IterableIterator<BasicInstance[]> {
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
    private readonly prologues: Generator<WordInstance>;
    private readonly products: RandomProducts;
    private readonly epilogues: Generator<WordInstance>;

    private readonly random: Random;

    constructor(
        prologueAliases: string[],
        products: RandomProducts,
        epilogueAliases: string[]
    ) {
        this.prologues = new AliasGenerator(prologueAliases);
        this.products = products;
        this.epilogues = new AliasGenerator(epilogueAliases);

        this.random = new Random('seed1');
    }

    *orders(): IterableIterator<WordOrProductInstance[]> {
        while (true) {
            const productInstance1 = this.products.onePermutedProduct();
            const productInstance2 = this.products.onePermutedProduct();
            yield [
                ...this.random.randomInstanceSequence(this.prologues),
                productInstance1,
                CreateWordInstance('and'),
                productInstance2,
                ...this.random.randomInstanceSequence(this.epilogues),
            ];
        }
    }
}

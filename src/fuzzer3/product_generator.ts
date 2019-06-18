import {
    OptionX,
    ProductX,
} from './fuzzer';

import { EntityGenerator } from './entity_generator';
import { OptionGenerator } from './option_generator';
import { Random } from './utilities';

export class ProductGenerator {
    entityGenerators: EntityGenerator[];
    optionGenerators: OptionGenerator[];

    constructor(
        entityGenerators: EntityGenerator[],
        optionGenerators: OptionGenerator[]
    ) {
        if (entityGenerators.length < 1) {
            const message = 'ProductGenerator: need at least one EntityGenerator';
            throw TypeError(message);
        }

        this.entityGenerators = entityGenerators;
        this.optionGenerators = optionGenerators;
    }

    randomProduct(random: Random): ProductX {
        const entity = this.entityGenerators[0].randomEntity(random);

        const options: OptionX[] = [];
        if (this.optionGenerators.length > 0) {
            const generator = random.randomChoice(this.optionGenerators);
            // options.push(generator.randomAttributedOption(random));
            options.push(generator.randomQuantifiedOption(random));
        }

        const product = new ProductX(
            entity.quantity,
            entity.attributes,
            options,
            entity.key,
            entity.text
        );
        return product;
    }
}
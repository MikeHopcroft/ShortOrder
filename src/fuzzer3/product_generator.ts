import {
    OptionX,
    ProductX,
} from './fuzzer';

import { EntityGenerator } from './entity_generator';
import { OptionGenerator } from './option_generator';
import { Random } from './utilities';

export class ProductGenerator {
    entityGenerator: EntityGenerator;
    optionGenerator: OptionGenerator;

    constructor(
        entityGenerator: EntityGenerator,
        optionGenerator: OptionGenerator
    ) {
        this.entityGenerator = entityGenerator;
        this.optionGenerator = optionGenerator;
    }

    randomProduct(random: Random): ProductX {
        const entity = this.entityGenerator.randomEntity(random);
        const options: OptionX[] = [
            this.optionGenerator.randomAttributedOption(random),
            // optionGenerator.randomQuantifiedOption(random),
        ];
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
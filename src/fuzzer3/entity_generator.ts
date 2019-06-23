import {
    AttributeInfo,
    ICatalog,
    Key,
    PID,
} from 'prix-fixe';

import { AttributeGenerator } from './attribute_generator';

import {
    EntityX,
    QuantityX
} from './fuzzer';

import {
    aliasesFromOneItem,
    Random
} from './utilities';

export class EntityGenerator {
    attributeInfo: AttributeInfo;
    attributesGenerator: AttributeGenerator;
    aliases: string[];
    pid: PID;

    keys: Key[];
    quantifiers: QuantityX[] = [];

    constructor(
        attributeInfo: AttributeInfo,
        attributeGenerator: AttributeGenerator,
        catalog: ICatalog,
        pid: PID,
        quantifiers: QuantityX[]
    ) {
        this.attributeInfo = attributeInfo;
        this.pid = pid;

        this.keys = [...catalog.getSpecificsForGeneric(pid)];

        this.attributesGenerator = attributeGenerator;
        this.quantifiers = quantifiers;

        const item = catalog.getGeneric(pid);
        this.aliases = [...aliasesFromOneItem(item)];
    }

    randomEntity(random: Random): EntityX {
        const quantity = random.randomChoice(this.quantifiers);

        const key = random.randomChoice(this.keys);
        const aids = this.attributeInfo.getAttributes(key);
        const attributes = this.attributesGenerator.get(aids, random);

        const alias = random.randomChoice(this.aliases);

        return new EntityX(
            quantity,
            attributes,
            key,
            alias
        );
    }
}
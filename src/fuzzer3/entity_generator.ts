import * as pluralize from 'pluralize';

import {
    AttributeInfo,
    ICatalog,
    PID,
    TensorEntityBuilder,
    TID
} from 'prix-fixe';

import { AttributeGenerator } from './attribute_generator';

import {
    AttributeX,
    EntityX,
    QuantityX
} from './fuzzer';

import {
    aliasesFromOneItem,
    Random
} from './utilities';

export class EntityGenerator {
    attributeInfo: AttributeInfo;
    pid: PID;
    attributes: AttributeGenerator;
    quantifiers: QuantityX[] = [];
    tid: TID;
    aliases: string[];

    constructor(
        attributeInfo: AttributeInfo,
        attributeGenerator: AttributeGenerator,
        catalog: ICatalog,
        pid: PID,
        quantifiers: QuantityX[]
    ) {
        this.attributeInfo = attributeInfo;
        this.pid = pid;
        this.attributes = attributeGenerator;
        this.quantifiers = quantifiers;

        this.tid = attributeInfo.getTensorForEntity(pid).tid;

        const item = catalog.getGeneric(pid);
        this.aliases = [...aliasesFromOneItem(item)];
    }

    randomEntity(random: Random): EntityX {
        const quantity = random.randomChoice(this.quantifiers);
        const attributes = this.attributes.randomCombination(this.tid, random);
        const alias = random.randomChoice(this.aliases);

        const builder = new TensorEntityBuilder(this.attributeInfo);
        builder.setPID(this.pid);
        for (const attribute of attributes) {
            builder.addAttribute(attribute.aid);
        }
        const key = builder.getKey();

        return new EntityX(
            quantity,
            attributes,
            key,
            alias
        );
    }
}
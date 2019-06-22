import {
    AttributeInfo,
    ICatalog,
    Key,
    PID,
    TensorEntityBuilder,
    TID
} from 'prix-fixe';

import { AttributeGenerator2 } from './attribute_generator2';

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
    pid: PID;
    keys: Key[];
    attributes: AttributeGenerator2;
    quantifiers: QuantityX[] = [];
    tid: TID;
    aliases: string[];

    constructor(
        attributeInfo: AttributeInfo,
        attributeGenerator: AttributeGenerator2,
        catalog: ICatalog,
        pid: PID,
        quantifiers: QuantityX[]
    ) {
        this.attributeInfo = attributeInfo;
        this.pid = pid;

        this.keys = [...catalog.getSpecificsForGeneric(pid)];

        this.attributes = attributeGenerator;
        this.quantifiers = quantifiers;

        this.tid = attributeInfo.getTensorForEntity(pid).tid;

        const item = catalog.getGeneric(pid);
        this.aliases = [...aliasesFromOneItem(item)];

        // Get all specific entities that match this PID.
        // For each specific entity, get its list of attributes.
        //   AttributeInfo.getAttributes()
        // Save list of attributes ... somewhere ... here or attribute generator?
        // Mainly only need attribute generator to deal with position constraints.
    }

    randomEntity(random: Random): EntityX {
        const quantity = random.randomChoice(this.quantifiers);

        const key = random.randomChoice(this.keys);
        const aids = this.attributeInfo.getAttributes(key);
        const attributes = this.attributes.get(aids, random);

        // const attributes = this.attributes.randomCombination(this.tid, random);
        const alias = random.randomChoice(this.aliases);

        // const builder = new TensorEntityBuilder(this.attributeInfo);
        // builder.setPID(this.pid);
        // for (const attribute of attributes) {
        //     builder.addAttribute(attribute.aid);
        // }
        // const key = builder.getKey();

        return new EntityX(
            quantity,
            attributes,
            key,
            alias
        );
    }
}
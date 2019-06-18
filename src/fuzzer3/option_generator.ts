import {
    AttributeInfo,
    ICatalog,
    PID,
    TensorEntityBuilder,
    TID
} from 'prix-fixe';

import { AttributeGenerator } from './attribute_generator';

import {
    AttributedOptionX,
    EITHER,
    LEFT,
    OptionX,
    QuantifiedOptionX,
    QuantityX,
    RIGHT,
    Position,
} from './fuzzer';

import {
    aliasesFromOneItem,
    Random
} from './utilities';

export type PositionPredicate = (alias:string) => Position;

export class OptionGenerator {
    attributeInfo: AttributeInfo;
    pid: PID;
    attributes: AttributeGenerator;
    positionPredicate: PositionPredicate;
    leftQuantifiers: QuantityX[];
    rightQuantifiers: QuantityX[];
    tid: TID;
    aliases: string[];

    constructor(
        attributeInfo: AttributeInfo,
        attributeGenerator: AttributeGenerator,
        catalog: ICatalog,
        pid: PID,
        positionPredicate: PositionPredicate,
        leftQuantifiers: QuantityX[],
        rightQuantifiers: QuantityX[]
    ) {
        this.attributeInfo = attributeInfo;
        this.pid = pid;
        this.attributes = attributeGenerator;
        this.positionPredicate = positionPredicate;
        this.leftQuantifiers = leftQuantifiers;
        this.rightQuantifiers = rightQuantifiers;

        this.tid = attributeInfo.getTensorForEntity(pid).tid;

        const item = catalog.getGeneric(pid);
        this.aliases = [...aliasesFromOneItem(item)];
    }

    randomAttributedOption(random: Random): OptionX {
        const attributes = this.attributes.randomCombination(this.tid, random);
        const alias = random.randomChoice(this.aliases);
        const position = this.positionPredicate(alias);

        const builder = new TensorEntityBuilder(this.attributeInfo);
        builder.setPID(this.pid);
        for (const attribute of attributes) {
            builder.addAttribute(attribute.aid);
        }
        const key = builder.getKey();

        return new AttributedOptionX(
            attributes[0],
            key,
            alias,
            position
        );
    }

    randomQuantifiedOption(random: Random): OptionX {
        let position: Position = LEFT;
        if (random.randomBoolean()) {
            position = RIGHT;
        }

        const quantity = random.randomChoice(
            position === LEFT ? this.leftQuantifiers: this.rightQuantifiers);

        const alias = random.randomChoice(this.aliases);

        const builder = new TensorEntityBuilder(this.attributeInfo);
        builder.setPID(this.pid);
        const key = builder.getKey();

        return new QuantifiedOptionX(
            quantity,
            key,
            alias,
            position
        );
    }
}
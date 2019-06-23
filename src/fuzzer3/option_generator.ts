import {
    AttributeInfo,
    ICatalog,
    Key,
    PID,
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
    attributes: AttributeGenerator;
    pid: PID;
    keys: Key[];
    positionPredicate: PositionPredicate;
    leftQuantifiers: QuantityX[];
    rightQuantifiers: QuantityX[];
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

        this.keys = [...catalog.getSpecificsForGeneric(pid)];

        this.attributes = attributeGenerator;
        this.positionPredicate = positionPredicate;
        this.leftQuantifiers = leftQuantifiers;
        this.rightQuantifiers = rightQuantifiers;

        const item = catalog.getGeneric(pid);
        this.aliases = [...aliasesFromOneItem(item)];
    }

    randomAttributedOption(random: Random): OptionX {
        const key = random.randomChoice(this.keys);
        const aids = this.attributeInfo.getAttributes(key);
        const attributes = this.attributes.get(aids, random);

        const alias = random.randomChoice(this.aliases);
        const position = this.positionPredicate(alias);

        return new AttributedOptionX(
            attributes,
            key,
            alias,
            position
        );
    }

    randomQuantifiedOption(random: Random): OptionX {
        const key = random.randomChoice(this.keys);

        let position: Position = LEFT;
        if (random.randomBoolean()) {
            position = RIGHT;
        }

        const quantity = random.randomChoice(
            position === LEFT ? this.leftQuantifiers: this.rightQuantifiers);

        const alias = random.randomChoice(this.aliases);

        return new QuantifiedOptionX(
            quantity,
            key,
            alias,
            position
        );
    }
}
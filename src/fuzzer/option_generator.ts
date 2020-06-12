import {
    AttributeInfo,
    ICatalog,
    IRuleChecker,
    Key,
    PID,
    TID,
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
    rules: IRuleChecker;
    pid: PID;
    keys: Key[];
    defaultKey: Key;
    positionPredicate: PositionPredicate;
    leftQuantifiers: QuantityX[];
    rightQuantifiers: QuantityX[];
    aliases: string[];

    constructor(
        attributeInfo: AttributeInfo,
        attributeGenerator: AttributeGenerator,
        catalog: ICatalog,
        rules: IRuleChecker,
        pid: PID,
        positionPredicate: PositionPredicate,
        leftQuantifiers: QuantityX[],
        rightQuantifiers: QuantityX[]
    ) {
        this.attributeInfo = attributeInfo;
        this.attributes = attributeGenerator;
        this.rules = rules;
        this.pid = pid;
        this.positionPredicate = positionPredicate;
        this.leftQuantifiers = leftQuantifiers;
        this.rightQuantifiers = rightQuantifiers;

        this.keys = [...catalog.getSpecificsForGeneric(pid)];
        this.defaultKey = catalog.getGeneric(pid).defaultKey;

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

    randomQuantifiedOption(parent: Key, random: Random): OptionX {
        const key = this.defaultKey;

        let position: Position = LEFT;
        if (random.randomBoolean()) {
            position = RIGHT;
        }

        let quantity = random.randomChoice(
            position === LEFT ? this.leftQuantifiers: this.rightQuantifiers
        );

        // Special case if quantifier not allowed for this parent-child
        // combination. Just use an empty-string QuantityX.
        const info = this.rules.getQuantityInfo(parent, key);
        if (info && info.minQty === 1 && info.maxQty === 1) {
            quantity = {
                text: '',
                value: 1
            };
        }

        const alias = random.randomChoice(this.aliases);

        return new QuantifiedOptionX(
            quantity,
            key,
            alias,
            position
        );
    }
}
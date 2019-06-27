import { Key, PID, RuleChecker } from 'prix-fixe';

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
    rules: RuleChecker;

    pidToGenerator = new Map<PID, OptionGenerator>();

    constructor(
        entityGenerators: EntityGenerator[],
        optionGenerators: OptionGenerator[],
        rules: RuleChecker
    ) {
        if (entityGenerators.length < 1) {
            const message = 'ProductGenerator: need at least one EntityGenerator';
            throw TypeError(message);
        }

        this.entityGenerators = entityGenerators;
        this.optionGenerators = optionGenerators;

        for (const generator of optionGenerators) {
            this.pidToGenerator.set(generator.pid, generator);
        }

        this.rules = rules;
    }

    randomProduct(random: Random): ProductX {
        const entityGenerator = random.randomChoice(this.entityGenerators);
        const entity = entityGenerator.randomEntity(random);

        // const options: OptionX[] = [];
        // if (this.optionGenerators.length > 0) {
        //     const generator = random.randomChoice(this.optionGenerators);
        //     // options.push(generator.randomAttributedOption(random));
        //     options.push(generator.randomQuantifiedOption(random));
        // }
        const options: OptionX[] = [];
        const generators = this.randomOptions(entity.key, 3, random);
        for (const generator of generators) {
            if (random.randomBoolean()) {
                options.push(generator.randomAttributedOption(random));
            } else {
                options.push(generator.randomQuantifiedOption(random));
            }
        }
        // const generator = this.randomOption(entity.key, random);
        // if (generator) {
        //     options.push(generator.randomAttributedOption(random));
        //     options.push(generator.randomQuantifiedOption(random));
        // }

        const product = new ProductX(
            entity.quantity,
            entity.attributes,
            options,
            entity.key,
            entity.text
        );

        return product;
    }

    randomOptions(key: Key, count: number, random: Random): OptionGenerator[] {
        const pool = [...this.rules.getValidChildren(key)];
        const pids = random.randomChooseN(pool, count);

        const generators: OptionGenerator[] = [];
        for (const pid of pids) {
            const g = this.pidToGenerator.get(pid);
            if (g) {
                generators.push(g);
            }
        }

        // TODO: need to eliminate mutual exclusion violations.

        return generators;
    }


    randomOption(key: Key, random: Random): OptionGenerator | undefined {
        const pids = [...this.rules.getValidChildren(key)];
        if (pids.length > 0) {
            const pid = random.randomChoice(pids);
            const generator = this.pidToGenerator.get(pid);
            return generator;
        }

        return undefined;
    }
}
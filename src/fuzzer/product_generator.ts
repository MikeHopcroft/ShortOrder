import { IRuleChecker, Key, PID } from 'prix-fixe';

import { OptionX, ProductX } from './fuzzer';

import { EntityGenerator } from './entity_generator';
import { OptionGenerator } from './option_generator';
import { Random } from './utilities';

export class ProductGenerator {
  entityGenerators: EntityGenerator[];
  optionGenerators: OptionGenerator[];
  optionCountRange: [number, number];
  rules: IRuleChecker;

  pidToGenerator = new Map<PID, OptionGenerator>();

  constructor(
    entityGenerators: EntityGenerator[],
    optionGenerators: OptionGenerator[],
    optionCountRange: [number, number],
    rules: IRuleChecker
  ) {
    if (entityGenerators.length < 1) {
      const message = 'ProductGenerator: need at least one EntityGenerator';
      throw TypeError(message);
    }

    this.entityGenerators = entityGenerators;
    this.optionGenerators = optionGenerators;
    this.optionCountRange = optionCountRange;

    for (const generator of optionGenerators) {
      this.pidToGenerator.set(generator.pid, generator);
    }

    this.rules = rules;
  }

  randomProduct(random: Random): ProductX {
    const entityGenerator = random.randomChoice(this.entityGenerators);
    const entity = entityGenerator.randomEntity(random);

    const options: OptionX[] = [];
    // TODO: Verify that option count is legal (e.g. singleton case)
    const count = random.randomInRange(
      this.optionCountRange[0],
      this.optionCountRange[1] + 1
    );
    const generators = this.randomOptions(entity.key, count, random);
    for (const generator of generators) {
      // TODO: only quantify ADD options
      if (random.randomBoolean()) {
        options.push(generator.randomAttributedOption(random));
      } else {
        options.push(generator.randomQuantifiedOption(entity.key, random));
      }
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

  randomOptions(key: Key, count: number, random: Random): OptionGenerator[] {
    const pids = this.randomChooseNCompatibleChildren(key, count, random);

    const generators: OptionGenerator[] = [];
    for (const pid of pids) {
      const g = this.pidToGenerator.get(pid);
      if (g) {
        generators.push(g);
      }
    }

    return generators;
  }

  private randomChooseNCompatibleChildren(
    parent: Key,
    count: number,
    random: Random
  ): PID[] {
    const pool = [...this.rules.getValidChildren(parent)];
    const pids: PID[] = [];

    const f = this.rules.getIncrementalMutualExclusionPredicate(parent);

    while (pool.length > 0 && pids.length < count) {
      // Remove one random PID from the pool.
      const index = random.randomNonNegative(pool.length);
      const pid = pool[index];
      pool[index] = pool[pool.length - 1];
      pool.pop();

      // TODO: HACK: BUGBUG: remove this placeholder key once prix-fixe API is updated
      // to use PIDs instead of Keys.
      const child = String(pid);

      if (f(child)) {
        pids.push(pid);
      }
    }

    return pids;
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

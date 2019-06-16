import { AID, DID, ICatalog, PID, AttributeInfo } from 'prix-fixe';
import { generateAliases } from 'token-flow';

import { patternFromExpression } from '../unified';

import { Generator } from './generator';
import { BasicInstance, CreateOptionInstance, Quantity } from './instances';
import { aliasesFromOneItem } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// OptionGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class OptionGenerator implements Generator<BasicInstance> {
    private readonly info: AttributeInfo;
    private readonly catalog: ICatalog;
    private readonly pid: PID;
    private readonly quantifiers: Quantity[];
    
    private readonly instances: BasicInstance[][];

    // Aliases for units
    // Some way to specify omitted option vs removed option ('no anchovies', 'without').
    constructor(info: AttributeInfo, catalog: ICatalog, pid: PID, quantifiers: Quantity[]) {
        this.info = info;
        this.catalog = catalog;
        this.pid = pid;

        // TODO: refactor so that all OptionGenerators can share expanded aliases.
        this.quantifiers = [];
        for (const quantifier of quantifiers) {
            const expression = quantifier.text;
            const pattern = patternFromExpression(expression);
            for (const text of generateAliases(pattern)) {
                this.quantifiers.push({text, value: quantifier.value});
            }
        }

        this.instances = [...this.createInstances()];
    }

    private *createInstances(): IterableIterator<BasicInstance[]> {
        const key = this.info.getKey(this.pid, new Map<DID, AID>());
        const item = this.catalog.getGeneric(this.pid);
        for (const quantity of this.quantifiers) {
            for (const alias of aliasesFromOneItem(item)) {
               yield [CreateOptionInstance(key, alias, quantity)];
            }
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): BasicInstance[] {
        return this.instances[id];
    }
}

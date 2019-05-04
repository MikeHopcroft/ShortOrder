import * as pluralize from 'pluralize';
import * as seedrandom from 'seedrandom';
import { Item, generateAliases, PID } from 'token-flow';

import { AttributeInfo, AttributeItem, Dimension, Matrix, Attributes } from '../attributes';
import { Catalog } from '../catalog';
import { ATTRIBUTE, ENTITY, OPTION, patternFromExpression, WORD, QUANTITY } from '../unified';


///////////////////////////////////////////////////////////////////////////////
//
// Instances
//
///////////////////////////////////////////////////////////////////////////////
export interface Instance {
    type: symbol;
    alias: string;
}

export const MODIFIER: unique symbol = Symbol('MODIFIER');
export type MODIFIER = typeof MODIFIER;

export interface AttributeInstance extends Instance {
    type: ATTRIBUTE;
    id: PID;
}

export function CreateAttributeInstance(id: PID, alias: string): AttributeInstance {
    return { type: ATTRIBUTE, id, alias };
}

export interface EntityInstance extends Instance {
    type: ENTITY;
    id: PID;

    quantity: Quantity;
}

export function CreateEntityInstance(id: PID, alias: string, quantity: Quantity): EntityInstance {
    return { type: ENTITY, id, alias, quantity };
}

export interface ModifierInstance extends Instance {
    type: MODIFIER;
    id: PID;
}

export function CreateModifierInstance(id: PID, alias: string): ModifierInstance {
    return { type: MODIFIER, id, alias };
}

export interface Quantity {
    value: number;
    text: string;
}

export interface QuantityInstance extends Instance {
    type: QUANTITY;
    value: number;
}

export function CreateQuantityInstance(quantity: Quantity): QuantityInstance {
    return { type: QUANTITY, alias: quantity.text, value: quantity.value };
}

export interface OptionInstance extends Instance {
    type: OPTION;
    id: PID;

    quantity: Quantity;
}

export function CreateOptionInstance(pid: PID, alias: string, quantity: Quantity): OptionInstance {
    return { type: OPTION, id: pid, alias, quantity };
}

export interface WordInstance extends Instance {
    type: WORD;
}

export function CreateWordInstance(text: string): WordInstance {
    return { type: WORD, alias: text };
}

export type  AnyInstance = 
    AttributeInstance |
    EntityInstance |
    ModifierInstance |
    OptionInstance |
    QuantityInstance |
    WordInstance;

export function formatInstanceDebug(instance: AnyInstance): string {
    switch (instance.type) {
        case ATTRIBUTE:
            return `ATTRIBUTE(${instance.alias},${instance.id})`;
        case ENTITY:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) ENTITY(${instance.alias},${instance.id})`;
            }
            else {
                return `ENTITY(${instance.alias},${instance.id})`;
            }
        case MODIFIER:
            return `MODIFIER(${instance.alias},${instance.id})`;
        case OPTION:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) OPTION(${instance.alias},${instance.id})`;
            }
            else {
                return `OPTION(${instance.alias},${instance.id})`;
            }
        case QUANTITY:
            return `QUANTITY(${instance.alias},${instance.value})`;
        case WORD:
            return `WORD(${instance.alias})`;
        default:
            return 'UNKNOWN';
    }
}

export function formatInstanceAsText(instance: AnyInstance): string {
    switch (instance.type) {
        case ATTRIBUTE:
        case ENTITY:
        case MODIFIER:
        case QUANTITY:
        case WORD:
            return instance.alias;
        case OPTION:
            if (instance.quantity.text.length > 0) {
                return `${instance.quantity.text} ${instance.alias}`;
            }
            else {
                return instance.alias;
            }
        default:
            return 'UNKNOWN';
    }
}



///////////////////////////////////////////////////////////////////////////////
//
// Generator
// Base class for all utterance generators.
//
///////////////////////////////////////////////////////////////////////////////
export interface Generator {
    count(): number;
    version(id: number): AnyInstance[];
}

export function* aliasesFromOneItem(item: Item) {
    for (const expression of item.aliases) {
        const pattern = patternFromExpression(expression);
        for (const text of generateAliases(pattern)) {
            yield text;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// ModifierGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class ModifierGenerator implements Generator {
    private readonly dimension: Dimension;
    private readonly instances: AnyInstance[][];

    constructor(dimension: Dimension) {
        this.dimension = dimension;

        // First instance is the empty list, corresponding to the no modifier choice.
        this.instances = [[]];

        // Add remaining modifier choices.
        for (const modifier of this.dimension.attributes) {
            for (const alias of aliasesFromOneItem(modifier)) {
                this.instances.push([CreateModifierInstance(modifier.pid, alias)]);
            }
        }
    }

    count(): number {
        return this.instances.length;
    }
    
    version(id: number): AnyInstance[] {
        return this.instances[id];
    }
}


///////////////////////////////////////////////////////////////////////////////
//
// OptionGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class OptionGenerator implements Generator {
    private readonly catalog: Catalog;
    private readonly pid: PID;
    private readonly quantifiers: Quantity[];
    
    private readonly instances: AnyInstance[][];

    // Aliases for units
    // Some way to specify omitted option vs removed option ('no anchovies', 'without').
    constructor(catalog: Catalog, pid: PID, quantifiers: Quantity[]) {
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

    private *createInstances(): IterableIterator<AnyInstance[]> {
        const item = this.catalog.get(this.pid);
        for (const quantity of this.quantifiers) {
            for (const alias of aliasesFromOneItem(item)) {
               yield [CreateOptionInstance(this.pid, alias, quantity)];
            }
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): AnyInstance[] {
        return this.instances[id];
    }
}


///////////////////////////////////////////////////////////////////////////////
//
// EntityGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class EntityGenerator implements Generator {
    private readonly info: AttributeInfo;
    private readonly catalog: Catalog;
    private readonly entityId: PID;
    private readonly quantifiers: Quantity[];

    private readonly matrix: Matrix;

    private readonly dimensionIdToAttributeId = new Map<PID, PID>();
    private readonly attributes: AttributeItem[] = [];

    private readonly instances: AnyInstance[][];

    constructor(attributeInfo: AttributeInfo, catalog: Catalog, entityId: PID, quantifiers: Quantity[]) {
        this.info = attributeInfo;
        this.catalog = catalog;
        this.entityId = entityId;

        // TODO: refactor so that all OptionGenerators can share expanded aliases.
        this.quantifiers = [];
        for (const quantifier of quantifiers) {
            const expression = quantifier.text;
            const pattern = patternFromExpression(expression);
            for (const text of generateAliases(pattern)) {
                this.quantifiers.push({text, value: quantifier.value});
            }
        }

        const matrix = this.info.getMatrixForEntity(this.entityId);
        if (!matrix) {
            const message = `Product ${entityId} does not have a matrix.`;
            throw TypeError(message);
        }
        this.matrix = matrix;

        this.instances = [...this.createInstances()];
    }

    private pushAttribute(dimension: Dimension, attribute: AttributeItem) {
        if (attribute.hidden !== true) {
            this.attributes.push(attribute);
        }
        this.dimensionIdToAttributeId.set(dimension.id, attribute.pid);
    }

    private popAttribute(dimension: Dimension, attribute: AttributeItem) {
        if (attribute.hidden !== true) {
            this.attributes.pop();
        }
    }

    private getPID(): PID | undefined {
        const key = this.matrix.getKey(this.entityId, this.dimensionIdToAttributeId, this.info);
        const pid = this.info.getPID(key);
        return pid;
    }

    private *entityVersions(): IterableIterator<EntityInstance> {
        const pid = this.getPID();
        if (pid === undefined) {
            return;
        }

        const item = this.catalog.get(this.entityId);
        for (let alias of aliasesFromOneItem(item)) {
            for (const quantity of this.quantifiers) {
                if (quantity.value > 1) {
                    alias = pluralize(alias);
                }
                yield CreateEntityInstance(pid, alias, quantity);
            }
        }
    }

    private *createInstances(): IterableIterator<AnyInstance[]> {
        yield* this.createInstancesRecursion(0);
    }

    private *createInstancesRecursion(d: number): IterableIterator<AnyInstance[]> {
        const dimension = this.matrix.dimensions[d];
    
        for (const attribute of dimension.attributes) {
            this.pushAttribute(dimension, attribute);
    
            if (d === this.matrix.dimensions.length - 1) {
                const pid = this.getPID();
                if (pid !== undefined) {
                    const attributes = this.attributes.map(a => CreateAttributeInstance(a.pid, a.name));
                    for (const entity of this.entityVersions()) {
                        yield [...attributes, entity];
                    }
                }
            }
            else {
                yield* this.createInstancesRecursion(d + 1);
            }
    
            this.popAttribute(dimension, attribute);
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): AnyInstance[] {
        return this.instances[id];
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// CompositeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class CompositeGenerator implements Generator {
    private readonly generators: Generator[];
    private readonly instanceCount: number;

    constructor(generators: Generator[]) {
        this.generators = generators;

        let count = 1;
        for (const generator of generators) {
            count *= generator.count();
        }
        this.instanceCount = count;
    }

    count(): number {
        return this.instanceCount;
    }

    version(id: number): AnyInstance[] {
        let code = id;
        let instances: AnyInstance[] = [];
        for (const generator of this.generators) {
            const x = code % generator.count();
            code = Math.floor(code / generator.count());
            instances = instances.concat(generator.version(x));
        }
        return instances;
    }
}


///////////////////////////////////////////////////////////////////////////////
//
// MapGenerator
//
///////////////////////////////////////////////////////////////////////////////
export type InstanceSequenceTransformer = (instances: AnyInstance[]) => AnyInstance[];

export class MapGenerator implements Generator {
    private readonly generator: Generator;
    private readonly transformers: InstanceSequenceTransformer[];

    constructor(generator: Generator, transformers: InstanceSequenceTransformer[]) {
        this.generator = generator;
        this.transformers = transformers;
    }

    count(): number {
        return this.generator.count();
    }

    version(id: number): AnyInstance[] {
        let instances = this.generator.version(id);
        for (const transformer of this.transformers) {
            instances = transformer(instances);
        }
        return instances;
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// AliasGenerator
//
///////////////////////////////////////////////////////////////////////////////
class AliasGenerator implements Generator {
    private readonly instances: AnyInstance[];

    constructor(aliases: string[]) {
        this.instances = [];
        for (const alias of aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of generateAliases(pattern)) {
                this.instances.push(CreateWordInstance(text));
            }
        }
    }

    count(): number {
        return this.instances.length;
    }

    version(id: number): AnyInstance[] {
        return [this.instances[id]];
    }
}


///////////////////////////////////////////////////////////////////////////////
//
// PermutedGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class PermutationGenerator implements Generator {
    private readonly instances: AnyInstance[];
    private readonly permutationCount: number;

    constructor(instances: AnyInstance[]) {
        this.instances = instances;
        this.permutationCount = factorial(instances.length);
    }

    count(): number {
        return this.permutationCount;
    }

    version(id: number): AnyInstance[] {
        return permutation(this.instances, id);
    }
}

export function permutation<T>(items: T[], lehmer: number) {
    const head: T[] = [];
    let tail = items;
    let code = lehmer;
    for (let divisor = items.length; divisor > 0; --divisor) {
        const index = code % divisor;
        code = Math.floor(code / divisor);
        head.push(tail[index]);
        tail = [...tail.slice(0, index), ...tail.slice(index + 1)];
    }
    return head;
}

export function factorial(n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    }
    else {
        return n * factorial(n - 1);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// addQuantity
//
// InstanceSequenceTransformer for MapGenerator
// Determines the quantity for the first EntityInstance and adds this value
// to the head of the sequence of instances.
//
///////////////////////////////////////////////////////////////////////////////
export function addQuantity(instances: AnyInstance[]): AnyInstance[] {
    for (const instance of instances) {
        if (instance.type === ENTITY) {
            return [CreateQuantityInstance(instance.quantity), ...instances];
        }
    }
    return instances;
}

///////////////////////////////////////////////////////////////////////////////
//
// LinguisticFixup
//
// InstanceSequenceTransformer for MapGenerator
// Performs small linguistic tranformations like
//   * Pluralize entity, based on quantity
//   * Choose between 'a' and 'an' based on following word
//   * Add 'with' and 'and' to list of trailing modifiers and options.
//   * Special case to suppress 'with' before 'without'. 
//
///////////////////////////////////////////////////////////////////////////////
export function linguisticFixup(instances: AnyInstance[]): AnyInstance[] {
    const result = [];
    let pastEntity = false;
    let pastPostEntityOption = false;

    // Get the entity quantity to decide whether to pluralize.
    let quantity = 1;
    if (instances.length > 0) {
        const x = instances[0];
        if (x.type === QUANTITY) {
            quantity = x.value;
        }
    }

    for (let i = 0; i < instances.length; ++i) {
        let instance = instances[i];
        if (pastEntity) {
            if (pastPostEntityOption) {
                if (i === instances.length - 1) {
                    result.push(CreateWordInstance('and'));
                }
            }
            else if (instance.type === OPTION && !instance.quantity.text.startsWith('without')) {
                pastPostEntityOption = true;
                result.push(CreateWordInstance('with'));
            }
        }
        else  if (instance.type === ENTITY) {
            if (quantity > 1) {
                instance = {...instance, alias: pluralize(instance.alias, quantity)};
            }
            pastEntity = true;
        }

        // // TODO: implement QUANTITY token
        // if (instance.type === QUANTITY && instance.alias === 'a') {
        //     if (i < instances.length - 2) {
        //         if (startsWithEnglishVowel(instances[i + 1].alias)) {
        //             instances.push({...instance, alias: 'an'});
        //         }
        //     }            
        // }
        result.push(instance);
    }

    return result;
}

///////////////////////////////////////////////////////////////////////////////
//
// Renderers
//
///////////////////////////////////////////////////////////////////////////////
// function renderAsTestCase(instanes: AnyInstance[]): TestCase {
// }


///////////////////////////////////////////////////////////////////////////////
//
// Pluralizer
//
///////////////////////////////////////////////////////////////////////////////
class Pluralizer {
    constructor(rules: Array<[RegExp, string]>) {
        for (const [pattern, replacement] of rules) {
            pluralize.addPluralRule(pattern, replacement);
        }
    }

    convert(word: string, count: number): string {
        return pluralize(word, count);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// ProductGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class ProductGenerator extends MapGenerator {
    constructor(entities: EntityGenerator, modifiers: ModifierGenerator, options: OptionGenerator) {
        const unquantifiedProduct = new CompositeGenerator([
            entities, modifiers, options
        ]);

        super(unquantifiedProduct, [addQuantity, linguisticFixup]);
    }
}

export class Random {
    private readonly random: seedrandom.prng;

    constructor(seed: string) {
        this.random = seedrandom('seed1'); 
    }

    // Returns random integer in range [start, end).
    randomInRange(start:number, end:number): number {
        if (end < start) {
            const message = "end must be less than start";
            throw TypeError(message);
        }
        return start + Math.floor(this.random() * (end - start));
    }

    // Returns a random natural number less than max.
    randomNonNegative(max: number): number {
        if (max < 0) {
            const message = "max cannot be less than 0";
            throw TypeError(message);
        }
        return Math.floor(this.random() * max);
    }

    randomChoice<T>(items: T[]): T {
        return items[this.randomNonNegative(items.length)];
    }

    randomInstanceSequence(generator: Generator): AnyInstance[] {
        return generator.version(this.randomNonNegative(generator.count()));
    }
}


///////////////////////////////////////////////////////////////////////////////
//
// RandomProducts
//
///////////////////////////////////////////////////////////////////////////////
export class RandomProducts {
    private readonly random: Random;

    private readonly entities: EntityGenerator[] = [];
    private readonly modifiers: ModifierGenerator[] = [];
    private readonly options: OptionGenerator[] = [];

    constructor(
        catalog: Catalog,
        attributeInfo: AttributeInfo,
        attributes: Attributes,
        entityQuantities: Quantity[],
        optionIds: PID[],
        optionQuantities: Quantity[],
        random: Random
    ) {
        this.random = random;

        for (const [pid, item] of catalog.map.entries()) {
            if (item.matrix !== undefined) {
                this.entities.push(new EntityGenerator(attributeInfo, catalog, item.pid, entityQuantities));
            }
        }

        for (const dimension of attributes.dimensions) {
            // Hack to determine if dimension is a modifier.
            if (dimension.items[0].sku !== undefined) {
                const d = attributeInfo.getDimension(dimension.did);
                if (d === undefined) {
                    const message = `unknown did ${dimension.did}`;
                    throw TypeError(message);
                }
                this.modifiers.push(new ModifierGenerator(d));
            }
        }

        for (const pid of optionIds) {
            this.options.push(new OptionGenerator(catalog, pid, optionQuantities));
        }
    }

    oneProduct(): AnyInstance[] {
        const entity = this.random.randomChoice(this.entities);
        const modifier = this.random.randomChoice(this.modifiers);
        const option = this.random.randomChoice(this.options);

        const product = new ProductGenerator(entity, modifier, option);

        return this.random.randomInstanceSequence(product);
    }

    *products(): IterableIterator<AnyInstance[]> {
        while (true) {
            yield this.oneProduct();
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// RandomOrders
//
///////////////////////////////////////////////////////////////////////////////
export class RandomOrders {
    private readonly prologues: Generator;
    private readonly products: RandomProducts;
    private readonly epilogues: Generator;

    private readonly random: Random;

    constructor(prologueAliases: string[], products: RandomProducts, epilogueAliases: string[]) {
        this.prologues = new AliasGenerator(prologueAliases);
        this.products = products;
        this.epilogues = new AliasGenerator(epilogueAliases);

        this.random = new Random('seed1');
    }

    *orders(): IterableIterator<AnyInstance[]> {
        while (true) {
                const product = this.products.oneProduct();
                const n = factorial(product.length);
                const permutedProduct = permutation(product, this.random.randomNonNegative(n));
            yield [
                ...this.random.randomInstanceSequence(this.prologues),
                ...permutedProduct,
                // ...this.products.oneProduct(),
                ...this.random.randomInstanceSequence(this.epilogues),
            ];
        }
    }
}

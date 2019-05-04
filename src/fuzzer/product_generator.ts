import * as pluralize from 'pluralize';

import { ENTITY, OPTION, QUANTITY } from '../unified';

import { CompositeGenerator } from './composite_generator';
import { EntityGenerator } from './entity_generator';
import { MapGenerator } from './map_generator';
import { ModifierGenerator } from './modifier_generator';
import { OptionGenerator } from './option_generator';
import {
    AnyInstance,
    CreateQuantityInstance,
    CreateWordInstance,
} from './instances';
import { factorial, permutation, Random } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// ProductGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class ProductGenerator extends CompositeGenerator {
    constructor(entities: EntityGenerator, modifiers: ModifierGenerator, options: OptionGenerator) {
        super([entities, modifiers, options]);
    }

    static permute(instances: AnyInstance[], random: Random): AnyInstance[] {
        const n = factorial(instances.length);
        return permutation(instances, random.randomNonNegative(n));
    }

    static complete(instances: AnyInstance[]): AnyInstance[] {
        return linguisticFixup(addQuantity(instances));
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
function addQuantity(instances: AnyInstance[]): AnyInstance[] {
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
function linguisticFixup(instances: AnyInstance[]): AnyInstance[] {
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

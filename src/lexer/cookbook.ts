import { aliasesFromPattern, RID, World } from 'prix-fixe';
import { Alias, Token } from 'token-flow';

import {
    matcherFromExpression,
    patternFromExpression,
} from '.';

export const PRODUCT_RECIPE: unique symbol = Symbol.for('PRODUCT_RECIPE');
export type PRODUCT_RECIPE = typeof PRODUCT_RECIPE;

export const OPTION_RECIPE: unique symbol = Symbol.for('OPTION_RECIPE');
export type OPTION_RECIPE = typeof OPTION_RECIPE;

export interface ProductRecipeToken extends Token {
    type: PRODUCT_RECIPE;
    rid: RID;
    name: string;
}

export interface OptiontRecipeToken extends Token {
    type: OPTION_RECIPE;
    rid: RID;
    name: string;
}

function createProductRecipe(rid: RID, name: string): ProductRecipeToken {
    return {
        type: PRODUCT_RECIPE,
        rid,
        name
    };
}

function createOptionRecipe(rid: RID, name: string): OptiontRecipeToken {
    return {
        type: OPTION_RECIPE,
        rid,
        name
    };
}

export function* generateRecipes(world: World): IterableIterator<Alias> {
    console.log();
    console.log('=== Recipes ===');
    const cookbook = world.cookbook;
    for (const product of cookbook.productRecipes()) {
        const token = createProductRecipe(product.rid, product.name);
        for (const alias of product.aliases) {
            const matcher = matcherFromExpression(alias);
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                console.log(`  ${text}`);
                yield { token, text, matcher };
            }
        }
    }

    // TODO: lots of parallel structure in the product and option loops.
    // Also in Cookbook class. Is there anyway to reduce this?
    // Perhaps two cookbooks, templated?
    for (const option of cookbook.optionRecipes()) {
        const token = createOptionRecipe(option.rid, option.name);
        for (const alias of option.aliases) {
            const matcher = matcherFromExpression(alias);
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                console.log(`  ${text}`);
                yield { token, text, matcher };
            }
        }
    }
}

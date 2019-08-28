export const foobar = 1;

// // import * as AJV from 'ajv';
// // import * as fs from 'fs';
// // import * as yaml from 'js-yaml';
// import { aliasesFromPattern, Cookbook, Key, ItemInstance, RID } from 'prix-fixe';
// import { Alias, Token } from 'token-flow';

// import {
//     matcherFromExpression,
//     patternFromExpression,
// } from '../lexer';


// // export type RID = number;

// // export interface RecipeList {
// //     products: ProductRecipe[];
// //     options: OptionRecipe[];
// // }

// // export interface ProductRecipe {
// //     name: string;
// //     rid: RID;
// //     aliases: string[];
// //     products: ProductTemplate[];
// // }

// // export interface OptionRecipe {
// //     name: string;
// //     rid: RID;
// //     aliases: string[];
// //     options: OptionTemplate[];
// // }

// // export interface ProductTemplate {
// //     quantity: number;
// //     key: Key;
// //     options: OptionTemplate[];
// // }

// // export interface OptionTemplate {
// //     quantity: number;
// //     key: Key;
// // }

// // // typescript-json-schema tsconfig.json RecipeList --required
// // const recipeListSchema = {
// //     "$schema": "http://json-schema.org/draft-07/schema#",
// //     "definitions": {
// //         "OptionRecipe": {
// //             "properties": {
// //                 "aliases": {
// //                     "items": {
// //                         "type": "string"
// //                     },
// //                     "type": "array"
// //                 },
// //                 "name": {
// //                     "type": "string"
// //                 },
// //                 "options": {
// //                     "items": {
// //                         "$ref": "#/definitions/OptionTemplate"
// //                     },
// //                     "type": "array"
// //                 },
// //                 "rid": {
// //                     "type": "number"
// //                 }
// //             },
// //             "required": [
// //                 "aliases",
// //                 "name",
// //                 "options",
// //                 "rid"
// //             ],
// //             "type": "object"
// //         },
// //         "OptionTemplate": {
// //             "properties": {
// //                 "key": {
// //                     "description": "A type alias to keep various concepts delineated.\n\nEach specific product such as `small strawberry milkshake` or `large decaf`\n`iced coffee` will have its own unique Key. The Key is a tensor where the\nfirst dimesnion is a generic product's PID, and any other dimensions\ndetermine which attributes are added.",
// //                     "type": "string"
// //                 },
// //                 "quantity": {
// //                     "type": "number"
// //                 }
// //             },
// //             "required": [
// //                 "key",
// //                 "quantity"
// //             ],
// //             "type": "object"
// //         },
// //         "ProductRecipe": {
// //             "properties": {
// //                 "aliases": {
// //                     "items": {
// //                         "type": "string"
// //                     },
// //                     "type": "array"
// //                 },
// //                 "name": {
// //                     "type": "string"
// //                 },
// //                 "products": {
// //                     "items": {
// //                         "$ref": "#/definitions/ProductTemplate"
// //                     },
// //                     "type": "array"
// //                 },
// //                 "rid": {
// //                     "type": "number"
// //                 }
// //             },
// //             "required": [
// //                 "aliases",
// //                 "name",
// //                 "products",
// //                 "rid"
// //             ],
// //             "type": "object"
// //         },
// //         "ProductTemplate": {
// //             "properties": {
// //                 "key": {
// //                     "description": "A type alias to keep various concepts delineated.\n\nEach specific product such as `small strawberry milkshake` or `large decaf`\n`iced coffee` will have its own unique Key. The Key is a tensor where the\nfirst dimesnion is a generic product's PID, and any other dimensions\ndetermine which attributes are added.",
// //                     "type": "string"
// //                 },
// //                 "options": {
// //                     "items": {
// //                         "$ref": "#/definitions/OptionTemplate"
// //                     },
// //                     "type": "array"
// //                 },
// //                 "quantity": {
// //                     "type": "number"
// //                 }
// //             },
// //             "required": [
// //                 "key",
// //                 "options",
// //                 "quantity"
// //             ],
// //             "type": "object"
// //         }
// //     },
// //     "properties": {
// //         "options": {
// //             "items": {
// //                 "$ref": "#/definitions/OptionRecipe"
// //             },
// //             "type": "array"
// //         },
// //         "products": {
// //             "items": {
// //                 "$ref": "#/definitions/ProductRecipe"
// //             },
// //             "type": "array"
// //         }
// //     },
// //     "required": [
// //         "options",
// //         "products"
// //     ],
// //     "type": "object"
// // };


// // class Cookbook {
// //     ridToProductRecipe = new Map<RID, ProductRecipe>();
// //     ridToOptionRecipe = new Map<RID, OptionRecipe>();

// //     constructor(recipes: RecipeList) {
// //         for (const product of recipes.products) {
// //             if (this.ridToProductRecipe.has(product.rid)) {
// //                 const message = `Encountered duplicate RID = ${product.rid}`;
// //                 throw TypeError(message);
// //             } else {
// //                 this.ridToProductRecipe.set(product.rid, product);
// //             }
// //         }
// //         for (const option of recipes.options) {
// //             if (this.ridToOptionRecipe.has(option.rid)) {
// //                 const message = `Encountered duplicate RID = ${option.rid}`;
// //                 throw TypeError(message);
// //             } else {
// //                 this.ridToOptionRecipe.set(option.rid, option);
// //             }
// //         }
// //     }

// //     *productRecipes(): IterableIterator<ProductRecipe> {
// //         for (const recipe of this.ridToProductRecipe.values()) {
// //             yield recipe;
// //         }
// //     }

// //     *optionRecipes(): IterableIterator<OptionRecipe> {
// //         for (const recipe of this.ridToOptionRecipe.values()) {
// //             yield recipe;
// //         }
// //     }

// //     findProductRecipe(rid: RID, parent: Key): ProductRecipe {
// //         // TODO: for now, parent Key is ignored.
// //         // In the future will implement the ability to have different
// //         // recipes for different parents.
// //         const recipe = this.ridToProductRecipe.get(rid);
// //         if (recipe) {
// //             return recipe;
// //         } else {
// //             const message = `findProductRecipe: unknown RID = ${rid}`;
// //             throw TypeError(message);
// //         }
// //     }

// //     findOptionRecipe(rid: RID, parent: Key): OptionRecipe {
// //         // TODO: for now, parent Key is ignored.
// //         // In the future will implement the ability to have different
// //         // recipes for different parents.
// //         const recipe = this.ridToOptionRecipe.get(rid);
// //         if (recipe) {
// //             return recipe;
// //         } else {
// //             const message = `findOptionRecipe: unknown RID = ${rid}`;
// //             throw TypeError(message);
// //         }
// //     }

// //     createItemsFromProductRecipe(recipe: ProductRecipe): ItemInstance[] {
// //         const products: ItemInstance[] = [];
// //         for (const product of recipe.products) {
// //             const options: ItemInstance[] = [];
// //             for (const option of product.options) {
// //                 options.push({
// //                     uid: 1,     // TODO: key generator
// //                     key: option.key,
// //                     quantity: option.quantity,
// //                     children: []
// //                 });
// //             }
// //             products.push({
// //                 uid:1,          // TODO: key generator
// //                 key: product.key,
// //                 quantity: product.quantity,
// //                 children: options
// //             });
// //         }
// //         return products;
// //     }

// //     createItemsFromOptionRecipe(recipe: OptionRecipe): ItemInstance[] {
// //         const options: ItemInstance[] = [];
// //         for (const option of recipe.options) {
// //             options.push({
// //                 uid: 1,     // TODO: key generator
// //                 key: option.key,
// //                 quantity: option.quantity,
// //                 children: []
// //             });
// //         }
// //         return options;
// //     }
// // }

// // const ajv = new AJV();
// // const cookbookValidator = ajv.compile(recipeListSchema);

// // function cookbookFromYamlFile(infile: string): Cookbook {
// //     const yamlText = fs.readFileSync(infile, 'utf8');
// //     const recipes = yaml.safeLoad(yamlText) as RecipeList;
// //     if (!cookbookValidator(recipes)) {
// //         const message = 'cookbookFromYamlFile: yaml data does not conform to schema.';
// //         console.log(message);
// //         console.log(cookbookValidator.errors);
// //         throw TypeError(message);
// //     }

// //     // TODO: enforce at least one product
// //     // TODO: enforce exactly one product when key===''
// //     // TODO: write kind field?

// //     return new Cookbook(recipes);
// // }

// export const PRODUCT_RECIPE: unique symbol = Symbol.for('PRODUCT_RECIPE');
// export type PRODUCT_RECIPE = typeof PRODUCT_RECIPE;

// export const OPTION_RECIPE: unique symbol = Symbol.for('OPTION_RECIPE');
// export type OPTION_RECIPE = typeof OPTION_RECIPE;

// export interface ProductRecipeToken extends Token {
//     type: PRODUCT_RECIPE;
//     rid: RID;
//     name: string;
// }

// export interface OptiontRecipeToken extends Token {
//     type: OPTION_RECIPE;
//     rid: RID;
//     name: string;
// }

// function createProductRecipe(rid: RID, name: string): ProductRecipeToken {
//     return {
//         type: PRODUCT_RECIPE,
//         rid,
//         name
//     };
// }

// function createOptionRecipe(rid: RID, name: string): OptiontRecipeToken {
//     return {
//         type: OPTION_RECIPE,
//         rid,
//         name
//     };
// }

// function* generateRecipes(cookbook: Cookbook): IterableIterator<Alias> {
//     // console.log();
//     // console.log('=== Recipes ===');
//     for (const product of cookbook.productRecipes()) {
//         const token = createProductRecipe(product.rid, product.name);
//         for (const alias of product.aliases) {
//             const matcher = matcherFromExpression(alias);
//             const pattern = patternFromExpression(alias);
//             for (const text of aliasesFromPattern(pattern)) {
//                 // console.log(`  ${text}`);
//                 yield { token, text, matcher };
//             }
//         }
//     }

//     // TODO: lots of parallel structure in the product and option loops.
//     // Also in Cookbook class. Is there anyway to reduce this?
//     // Perhaps two cookbooks, templated?
//     for (const option of cookbook.optionRecipes()) {
//         const token = createProductRecipe(option.rid, option.name);
//         for (const alias of option.aliases) {
//             const matcher = matcherFromExpression(alias);
//             const pattern = patternFromExpression(alias);
//             for (const text of aliasesFromPattern(pattern)) {
//                 // console.log(`  ${text}`);
//                 yield { token, text, matcher };
//             }
//         }
//     }
// }

// import * as fs from 'fs';

// import {
//     DiffResults,
//     DownstreamTermPredicate,
//     EqualityPredicate,
//     exactPrefix,
//     generateAliases,
//     GenericEquality,
//     Hash,
//     Item,
//     itemMapFromYamlString,
//     levenshtein,
//     Lexicon,
//     Matcher,
//     NumberToken,
//     Token,
//     Tokenizer,
//     TokenPredicate,
//     UNKNOWNTOKEN,
//     NUMBERTOKEN
// } from 'token-flow';

// import { attributesFromYamlString, itemsFromAttributes } from '../attributes/schema';

// import { ATTRIBUTE, AttributeToken, attributeTokenFactory } from './attributes';
// import { ENTITY, EntityToken, entityTokenFactory } from './entities';
// import { intentTokenFactory } from './intents';
// import { OPTION, OptionToken } from './options';
// import { QUANTITY, QuantityToken, quantityTokenFactory } from './quantities';
// import { stopwordsFromYamlString, Stopwords } from '../stopwords';
// import { UNIT, UnitToken, unitTokenFactory } from './units';

// import {World} from 'prix-fixe';

// function attributeAliases(world: pf.World, dimensions: Set<DID>) {
//     for (const did of dimensions.values()) {
//         const d = world.attributeInfo.getDimension(did);
//         console.log(`  Dimension(${d.did}): ${d.name}`);
//         for (const attribute of d.attributes) {
//             console.log(`    Attribute(${attribute.aid})`);
//             for (const alias of attribute.aliases) {
//                 const pattern = patternFromExpression(alias);
//                 for (const text of aliasesFromPattern(pattern)) {
//                     console.log(`      ${text}`);
//                 }
//             }
//         }
//     }
// }


// class LexicalAnalyzer {
//     lexicon: Lexicon;
//     tokenizer: Tokenizer;

//     constructor(
//         intentsFile: string,
//         quantifiersFile: string,
//         unitsFile: string,
//         stopwordsFile: string,
//         debugMode = false
//     ) {
//         this.lexicon = new Lexicon();
//         this.tokenizer = new Tokenizer(
//             this.lexicon.termModel,
//             this.lexicon.numberParser,
//             debugMode
//         );

//         // Attributes
//         const attributes =
//             attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
//         const attributeItems = itemsFromAttributes(attributes);
//         const attributeAliases = aliasesFromItems(attributeItems, attributeTokenFactory);
//         this.lexicon.addDomain(attributeAliases);

//         // Entities
//         const entities = aliasesFromYamlString(
//             fs.readFileSync(entityFile, 'utf8'),
//             entityTokenFactory);
//         this.lexicon.addDomain(entities);

//         // Quantifiers
//         const quantifiers = aliasesFromYamlString(
//             fs.readFileSync(quantifiersFile, 'utf8'),
//             quantityTokenFactory);
//         this.lexicon.addDomain(quantifiers);

//         // Units
//         const units = aliasesFromYamlString(
//             fs.readFileSync(unitsFile, 'utf8'),
//             unitTokenFactory);
//         this.lexicon.addDomain(units);

//         // Intents
//         const intents = aliasesFromYamlString(
//             fs.readFileSync(intentsFile, 'utf8'),
//             intentTokenFactory);
//         this.lexicon.addDomain(intents);
        
//         // Stopwords
//         const stopwords = stopwordsFromYamlString(
//             fs.readFileSync(stopwordsFile, 'utf8'));
//         const stopwordTokens = tokensFromStopwords(stopwords);
//         this.lexicon.addDomain(stopwordTokens, false);

//         this.lexicon.ingest(this.tokenizer);
//     }
// }

import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {
    attributesFromYamlString,
    AttributeInfo,
    CartOps,
    Catalog,
    CatalogItems,
    ConvertDollarsToPennies,
    Parser,
    Unified,
    validateCatalogItems
} from '..';
import { Attributes } from '../attributes';

export interface World {
    attributes: Attributes;
    attributeInfo: AttributeInfo;
    catalog: Catalog;
    ops: CartOps;
    parser: Parser;
    unified: Unified;
}


export function setup(
    catalogFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifiersFile: string,
    unitsFile: string,
    stopwordsFile: string,
    debugMode: boolean,
    itemFolding = true
): World {
    const catalogItems = yaml.safeLoad(fs.readFileSync(catalogFile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);

    const attributes = attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    const attributeInfo = AttributeInfo.factory(catalog, attributes);

    const ops = new CartOps(catalog, true, itemFolding);

    const unified = 
        new Unified(
            catalogFile,
            intentsFile,
            attributesFile,
            quantifiersFile,
            unitsFile,
            stopwordsFile,
            debugMode);

    const parser = new Parser(catalog, attributeInfo, unified, debugMode);

    return {
        attributes,
        attributeInfo,
        catalog,
        ops,
        parser,
        unified
    };
}
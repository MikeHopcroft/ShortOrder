// import * as style from 'ansi-styles';
import chalk from 'chalk';
import { NUMBERTOKEN, Token } from 'token-flow';

import { AttributeInfo } from '../attributes';
import { Catalog } from '../catalog';
import { AnyToken, ATTRIBUTE, AttributeToken, ENTITY, QUANTITY, UNIT, WORD, EntityToken } from '../unified';


export function tokenToColoredString(t: Token, catalog: Catalog, attributeInfo: AttributeInfo) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = chalk.bgRed(`[ATTRIBUTE:${attribute},${token.id}]`);
            break;
        case ENTITY:
            // const entity = token.name.replace(/\s/g, '_').toUpperCase();
            // name = chalk.bgGreenBright(`[ENTITY:${entity},${token.pid}]`);
            name = FormatEntityToken(token, catalog);
            break;
        case NUMBERTOKEN:
            name = chalk.bgCyan(`[NUMBER:${token.value}]`);
            break;
        case QUANTITY:
            name = chalk.bgCyan(`[QUANTITY:${token.value}]`);
            break;
        case UNIT:
            const unit = token.name.replace(/\s/g, '_').toUpperCase();
            name = chalk.bgMagenta(`[UNIT:${unit},${token.id}]`);
            break;
        case WORD:
            name = `[WORD:${token.text}]`;
            break;
        default:
            {
                const symbol = t.type.toString();
                name = chalk.bgYellow(`[${symbol.slice(7, symbol.length - 1)}]`);
            }
    }
    return name;
}

// function FormatAttributeToken(token: AttributeToken, catalog: Catalog, info: AttributeInfo) {
//     // const item = catalog.get(token.id);
//     const coordinate = info.getAttributeCoordinates(token.id);

//     if (coordinate) {
//         if (coordinate.)
//     }
//     else {
//         const attribute = token.name.replace(/\s/g, '_').toUpperCase();
//         return chalk.bgRed(`[ATTRIBUTE:${attribute},${token.id}]`)
//     }
// }

function FormatEntityToken(token: EntityToken, catalog: Catalog) {
    const item = catalog.get(token.pid);
    if (item) {
        const entity = item.name.replace(/\s/g, '_').toUpperCase();
        if (item.standalone) {
            return chalk.bgGreenBright(`[ITEM:${entity},${token.pid}]`);    
        }
        else {
            return chalk.bgGreen(`[OPTION:${entity},${token.pid}]`);    
        }
    }
    else {
        const entity = token.name.replace(/\s/g, '_').toUpperCase();
        return chalk.bgGreen(`[ENTITY:${entity},${token.pid}]`);
    }
}
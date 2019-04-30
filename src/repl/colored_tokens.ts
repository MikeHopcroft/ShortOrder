// import * as style from 'ansi-styles';
import chalk from 'chalk';
import { NUMBERTOKEN, Token } from 'token-flow';

import { AttributeInfo } from '../attributes';
import { Catalog } from '../catalog';
import { AnyToken, ATTRIBUTE, AttributeToken, ENTITY, OPTION, QUANTITY, UNIT, WORD, EntityToken } from '../unified';


export function tokenToColoredString(t: Token, catalog: Catalog, attributeInfo: AttributeInfo) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = chalk.bgRed(`[ATTRIBUTE:${attribute},${token.id}]`);
            break;
        case ENTITY:
            name = FormatEntityToken(token, catalog);
            break;
        case NUMBERTOKEN:
            name = chalk.bgCyan(`[NUMBER:${token.value}]`);
            break;
        case OPTION:
            const option = token.name.replace(/\s/g, '_').toUpperCase();
            name = chalk.bgRed(`[OPTION:${option},${token.id}]`);
            break;
        case QUANTITY:
            name = chalk.bgCyan(`[QUANTITY:${token.value}]`);
            break;
        case UNIT:
            const unit = token.name.replace(/\s/g, '_').toUpperCase();
            name = chalk.bgMagenta(`[UNIT:${unit},${token.id}]`);
            break;
        case WORD:
            name = chalk.bgWhite(`[WORD:${token.text}]`);
            break;
        default:
            {
                const symbol = t.type.toString();
                name = chalk.bgYellow(`[${symbol.slice(7, symbol.length - 1)}]`);
            }
    }
    return name;
}

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
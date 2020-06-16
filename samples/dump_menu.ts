import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';

import { writeToPath, writeToString } from '@fast-csv/format';

import {
    createWorld2,
    fail,
    MENUITEM,
    succeed,
} from 'prix-fixe';

export async function main() {
    dotenv.config();
    const args = minimist(process.argv.slice(2));

    const help = 
        (args['h'] === true) || 
        (args['help'] === true) ||
        (args['?'] === true);
    if (help) {
        showUsage();
        succeed(false);
    }

    console.log(JSON.stringify(args));
    const outFile = args._[0];
    console.log(`outfile="${outFile}"`);
    if (!outFile) {
        fail('Expected output file.');
    }

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        console.log('Use -d flag or PRIX_FIXE_DATA environment variable to specify data path');
        return;
    }

    const world = createWorld2(dataPath);
    const catalog = world.catalog;

    const rows: Array<[number, string, string]> = [];
    for (const item of catalog.specificEntities()) {
        rows.push([
            item.sku,
            item.kind === MENUITEM ? 'product' : 'option',
            item.name
        ]);
    }
    rows.sort((a, b) => a[0] - b[0]);

    const headerAndRows: Array<[string|number, string, string]>  = rows;
    headerAndRows.unshift(['sku','type','name']);

    console.log(`Writing ${headerAndRows.length - 1} products to ${path.resolve(outFile)}`);
    await writeToPath(outFile, headerAndRows);
}

function showUsage() {
    console.log('Usage:');
}

main();


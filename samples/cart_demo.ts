import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Catalog, CatalogItems, validateCatalogItems, ConvertDollarsToPennies } from '../src';
import { Cart, CartOps } from '../src';
import { PID } from 'token-flow';


function go(infile: string, operations: Array<{pid: PID, quantity: number}>) {
    const catalogItems = yaml.safeLoad(fs.readFileSync(infile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);
    
    const ops = new CartOps(catalog);
    
    let cart: Cart = { items: []};

    for (const op of operations) {
        console.log('-----------------------------------------');

        const description = catalog.get(op.pid);
        console.log(`"${op.quantity} ${description.name}":`);
        console.log();

        cart = ops.updateCart(cart, op.pid, op.quantity);
        ops.printCart(cart);
        console.log();

        const missingChoices = ops.missingChoicesInCart(cart);
        for (const missing of missingChoices) {
            console.log(missing);
        }
        console.log();
    }
}

const operations: Array<{pid: PID, quantity: number}> = [
    { pid: 2, quantity: 1},
    { pid: 1, quantity: 2},

    // This exposes a bug. Adds 2nd cheeseburger line item
    // instead of increasing the quantity of the first cheeseburger.
    { pid: 2, quantity: 1},
    
    { pid: 5200, quantity: 2},
    { pid: 5201, quantity: 0},
    { pid: 5201, quantity: 5},
    
    // { pid: 2, quantity: 1},

    { pid: 5202, quantity: 4},
    { pid: 5200, quantity: 0},
    { pid: 5101, quantity: 2},
    { pid: 100, quantity: 7},
    { pid: 1000, quantity: 1},
    { pid: 1090, quantity: 0},
    { pid: 1, quantity: 0},
    { pid: 7000, quantity: 1},
    { pid: 6000, quantity: 2},
    { pid: 1000, quantity: 1},
    { pid: 1090, quantity: 0},
];


const operations2: Array<{pid: PID, quantity: number}> = [
    { pid: 1, quantity: 2},
    { pid: 5101, quantity: 2}
];

go('./samples/data/restaurant-en/menu2.yaml', operations);

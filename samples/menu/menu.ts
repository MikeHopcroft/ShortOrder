import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Decoder, array, object, number, string, boolean } from 'type-safe-json-decoder';
import { Index, Item, PID } from '../../src/tokenizer';
import { copyArray, copyScalar } from '../../src/utilities';

export interface MenuItem extends Item {
    pid: PID;
    name: string;
    registerName: string;
    aliases: string[];
    defaults: PID[];
    options: PID[];
    price: number;
    standalone: boolean;
}

// tslint:disable-next-line:no-any
function MenuItemFromYamlItem(item: any) {
    return {
        pid: copyScalar<number>(item, 'pid', 'number'),
        name: copyScalar<string>(item, 'name', 'string'),
        registerName: copyScalar<string>(item, 'registerName', 'string'),
        aliases: copyArray<string>(item, 'aliases', 'string'),
        price: copyScalar<number>(item, 'price', 'number'),
        standalone: copyScalar<boolean>(item, 'standalone', 'boolean'),
        defaults: copyArray<number>(item, 'defaults', 'number'),
        options: copyArray<number>(item, 'options', 'number'),
    };
}

export class Menu extends Index<MenuItem> {
    items: { [index: number]: MenuItem } = {};

    // TODO: return IMenu?
    static fromJsonFilename(filename: string): Menu {
        const json = fs.readFileSync(filename, 'utf8');

        const menuItemsDecoder: Decoder<MenuItem[]> =
            array(
                object(
                    ['pid', number()],
                    ['name', string()],
                    ['register_name', string()],
                    ['aliases', array(string())],
                    ['defaults', array(number())],
                    ['options', array(number())],
                    ['price', number()],
                    ['standalone', boolean()],
                    (pid, name, registerName, aliases, defaults, options, price, standalone) => (
                        { pid, name, registerName, aliases, defaults, options, price, standalone })));

        const items: MenuItem[] = menuItemsDecoder.decodeJSON(json);
        return new Menu(items);
    }

    static fromYamlFilename(filename: string): Menu {
        // tslint:disable-next-line:no-any
        const yamlMenu: any = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

        if (typeof (yamlMenu) !== 'object') {
            throw TypeError('Menu: expected a top-level object with items array.');
        }

        const yamlItems = yamlMenu['items'] as MenuItem[];
        if (yamlItems === undefined || !Array.isArray(yamlMenu.items)) {
            throw TypeError('Menu: expected items array.');
        }

        const items = yamlItems.map(MenuItemFromYamlItem);

        return new Menu(items);
    }

    constructor(items: MenuItem[]) {
        super();
        items.forEach(this.addItem);
    }

    addItem = (item: MenuItem) => {
        if (item.pid in this.items) {
            console.log(`Menu: skipping duplicate ${item.pid}`);
        }
        else {
            this.items[item.pid] = item;
        }
    }

    length() {
        return Object.keys(this.items).length;
    }
}


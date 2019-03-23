import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { PID } from 'token-flow';

import { attributesFromYamlString, AttributeInfo, AttributeItem, itemsFromAttributes, Matrix } from '../src/attributes';
import { Catalog, ItemDescription } from '../src/catalog';

function* combinationsHelper(matrix: Matrix, index: number, map: Map<PID,PID>): IterableIterator<Map<PID, PID>> {
    const dimension = matrix.dimensions[index];
    for (const attribute of dimension.attributes) {
        map.set(dimension.id, attribute.pid);
        if (index === matrix.dimensions.length - 1) {
            yield map;
        }
        else {
            yield* combinationsHelper(matrix, index + 1, map);
        }
    }
}

function* combinations(matrix: Matrix): IterableIterator<Map<PID, PID>> {
    yield* combinationsHelper(matrix, 0, new Map<PID,PID>());
}

function getName(
    combos: Map<PID, PID>,
    attributeFromPID: Map<PID, AttributeItem>,
    name: string
): string {
    const fields: string[] = [];
    for (const pid of combos.values()) {
        const attribute = attributeFromPID.get(pid);
        if (attribute === undefined) {
            const message = `unknown attribute pid ${pid}`;
            throw TypeError(message);
        }
        if (!attribute.hidden) {
            fields.push(attribute.name);
        }
    }

    fields.push(name);

    return fields.join(' ');
}

function go(attributesFile: string, item: ItemDescription) {
    const attributes =
        attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    
    const attributeFromPID = new Map<PID, AttributeItem>();
    for (const attribute of itemsFromAttributes(attributes)) {
        if (attributeFromPID.has(attribute.pid)) {
            const message = `duplicate attribute id ${attribute.pid}`;
            throw TypeError(message);
        }
        attributeFromPID.set(attribute.pid, attribute);
    }

    const catalogItems = { items: [] };
    const catalog = new Catalog(catalogItems);

    const info = AttributeInfo.factory(catalog, attributes);

    const matrixId = item.matrix;
    if (matrixId === undefined) {
        const message = `unknown matrix id ${matrixId}`;
        throw TypeError(message);
    }
    const matrix = info.getMatrix(matrixId);
    if (matrix === undefined) {
        const message = `unknown matrix id ${matrixId}.`;
        throw TypeError(message);
    }

    const items: ItemDescription[] = [item];

    let pid = item.pid + 1;
    const base = item.name;
    for (const c of combinations(matrix)) {
        // const a = [...c.values()].map((x) => (attributeFromPID.get(x) as AttributeItem).name).join(' ');
        // const name = `${a} ${base}`;

        // const text = [...c.values()].map((x) => (attributeFromPID.get(x) as AttributeItem).name).join(' ');
        const name = getName(c, attributeFromPID, base);
        const key = matrix.getKey(c, info);

        items.push({
            pid,
            name,
            aliases: [name],
            price: item.price,
            standalone: true,
            key,
            composition: {
                defaults: [],
                choices: [],
                substitutions: [],
                options: []
            }
        });

        console.log(`${pid}: ${name} (key = ${key})`);
        pid++;
    }

    const yamlText = yaml.dump(items);
    console.log(yamlText);

    console.log('done');
}

const coffeeMatrix = 2;
const latte: ItemDescription = {
    pid: 9000,
    name: 'latte',
    aliases: ['latte'],
    price: 1.99,
    standalone: true,
    matrix: coffeeMatrix,
    composition: {
        defaults: [],
        choices: [],
        substitutions: [],
        options: []
    }
};

go(
    path.join(__dirname, './data/restaurant-en/attributes.yaml'),
    latte
);

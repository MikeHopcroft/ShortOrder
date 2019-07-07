import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { CatalogItems, ChoiceDescription, ComponentDescription, SubstitutionDescription } from '../catalog';

//
// Tool for converting menu file from one schema to another.
// WARNING: this implementation does not preserve comments.
//

interface ItemDescriptionOld {
    pid: number;
    name: string;
    registerName: string;
    aliases: string[];
    price: number;
    standalone: boolean;
    defaults: number[];
    options: number[];
}

interface CatalogItemsOld {
    items: ItemDescriptionOld[];
}

export function convert(infile: string, outfile: string) {
    const yamlTextOld = fs.readFileSync(infile, 'utf8');
    const yamlRootOld = yaml.safeLoad(yamlTextOld) as CatalogItemsOld;

    const root: CatalogItems = {
        items: yamlRootOld.items.map( item => {
            const { defaults, options, ...rest } = item;
            return {
                ...rest,
                composition: {
                    defaults: defaults.map( pid => {
                        return {
                            pid,
                            defaultQuantity: 1,
                            minQuantity: 0,
                            maxQuantity: 3,
                            price: 0.30
                        } as ComponentDescription;
                    }),
                    choices: [] as ChoiceDescription[],
                    substitutions: [] as SubstitutionDescription[],
                    options: options.map( pid => {
                        return {
                            pid,
                            defaultQuantity: 1,
                            minQuantity: 0,
                            maxQuantity: 3,
                            price: 0.30
                        } as ComponentDescription;
                    })
                }
            };
        })
    };

    const yamlTextNew = yaml.safeDump(root);

    fs.writeFileSync(outfile, yamlTextNew);
}


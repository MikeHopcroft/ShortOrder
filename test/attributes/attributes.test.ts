import { assert } from 'chai';
import 'mocha';

import * as yaml from 'js-yaml';

import { attributesFromYamlString } from '../../src/attributes';

const attributes = {
    dimensions: [
        {
            did: 1,
            name: 'size',
            items: [
                {
                    pid: 1,
                    name: 'small',
                    aliases: ['small']
                },
                {
                    pid: 2,
                    name: 'medium',
                    aliases: ['medium'],
                    isDefault: true
                },
                {
                    pid: 3,
                    name: 'large',
                    aliases: ['large']
                }
            ]
        },
        {
            did: 2,
            name: 'flavor',
            items: [
                {
                    pid: 4,
                    name: 'vanilla',
                    aliases: ['vanilla'],
                    isDefault: true
                },
                {
                    pid: 5,
                    name: 'chocolate',
                    aliases: ['chocolate']
                },
                {
                    pid: 6,
                    name: 'strawberry',
                    aliases: ['strawberry']
                },
            ]
        }
    ],
    matrices: [
        {
            mid: 1,
            name: 'cones',
            dimensions: [1, 2]
        }
    ]
};


describe('Attributes', () => {

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  itemsFromAttributes
    //
    ///////////////////////////////////////////////////////////////////////////////
    it('itemsFromAttributes', () => {
        const yamlText = yaml.dump(attributes);
        const observed = attributesFromYamlString(yamlText);
        assert.deepEqual(observed, attributes);
    });
});


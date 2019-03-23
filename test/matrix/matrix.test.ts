import { assert } from 'chai';
import 'mocha';

import { PID } from 'token-flow';
import { AttributeItem, Dimension, Matrix, AttributeInfo } from '../../src/matrix';
import { dim } from 'ansi-styles';

const attributes: AttributeItem[] = [
    {
        pid: 0,
        name: 'zero',
        aliases: ['zero', 'z']
    },
    {
        pid: 1,
        name: 'one',
        aliases: ['one', 'first'],
        isDefault: true
    },
    {
        pid: 2,
        name: 'two',
        aliases: ['two', 'second']
    },
];

const sizeSmall = 0;
const sizeMedium = 1;
const sizeLarge = 2;
const sizes: AttributeItem[] = [
    {
        pid: sizeSmall,
        name: 'small',
        aliases: ['small']
    },
    {
        pid: sizeMedium,
        name: 'medium',
        aliases: ['medium'],
        isDefault: true
    },
    {
        pid: sizeLarge,
        name: 'large',
        aliases: ['large']
    },
];

const flavorVanilla = 3;
const flavorChocolate = 4;
const flavorStrawberry = 5;
const flavors: AttributeItem[] = [
    {
        pid: flavorVanilla,
        name: 'vanilla',
        aliases: ['vanilla'],
        isDefault: true
    },
    {
        pid: flavorChocolate,
        name: 'chocolate',
        aliases: ['chocolate']
    },
    {
        pid: flavorStrawberry,
        name: 'strawberry',
        aliases: ['strawberry']
    },
];

const styleRegular = 6;
const styleOriginal = 7;
const styles: AttributeItem[] = [
    {
        pid: styleRegular,
        name: 'regular',
        aliases: ['regular'],
        isDefault: true
    },
    {
        pid: styleOriginal,
        name: 'original',
        aliases: ['original']
    },
];

const size: PID = 0;
const flavor: PID = 1;
const style: PID = 2;
const softServeDimensions = [
    new Dimension(size, sizes.values()),
    new Dimension(flavor, flavors.values()),
    new Dimension(style, styles.values())
];

describe('Matrix', () => {

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Dimension
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('Dimension', () => {
        it('Constructor', () => {
            const idOfDefault = 1;
            const anyDimensionId = 123;
            const dimension = new Dimension(anyDimensionId, attributes.values());

            assert.equal(dimension.id, anyDimensionId);
            assert.deepEqual(dimension.attributes, attributes);
            assert.equal(dimension.defaultAttribute, idOfDefault);
        });

        it('No attributes', () => {
            const anyDimensionId = 123;
            const f = () => new Dimension(anyDimensionId, [].values());

            assert.throws(f, `expect at least one attribute`);
        });

        it('Second default', () => {
            const anyDimensionId = 123;
            const f = () => new Dimension(anyDimensionId, [...attributes, ...attributes].values());

            assert.throws(f, `found second default attribute 1`);
        });

        it('No defaults', () => {
            const anyDimensionId = 123;
            const attributes2 = [attributes[0], attributes[2]];
            const f = () => new Dimension(anyDimensionId, attributes2.values());

            assert.throws(f, `expected at least one default attribute`);
        });
    });

    
    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Matrix
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('Matrix', () => {
        it('Constructor', () => {
            const anyMatrixId = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions);

            assert.equal(matrix.id, anyMatrixId);
            assert.deepEqual(matrix.dimensions, softServeDimensions);
            assert.deepEqual(matrix.scales, [1, 3, 9]);
            assert.deepEqual(matrix.counts, [3, 3, 2]);
        });

        it('getKey()', () => {
            const anyMatrixId = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions);

            const info = new AttributeInfo();
            for (const dimension of softServeDimensions) {
                info.addDimension(dimension);
            }

            const dimensionIdToAttribute = new Map<PID, PID>();
            dimensionIdToAttribute.set(size, sizeMedium);
            dimensionIdToAttribute.set(flavor, flavorChocolate);
            dimensionIdToAttribute.set(style, styleOriginal);

            //    medium: position 1 * scale 1 =  1
            // chocolate: position 1 * scale 3 =  3
            //  original: position 1 * scale 9 =  9
            //                             key = 13
            assert.equal(matrix.getKey(dimensionIdToAttribute, info), 13);
        });
    });

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  AttributeInfo
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('AttributeInfo', () => {
        it('addDimension()', () => {
            // getAttributeCoordinates()
            // `found duplicate dimension id x`
            // `found duplicate attribute pid x`
        });

        it('addMatrix()', () => {
            // getMatrix()
            // `found duplicate matrix id x`
        });

        it('addGenericEntity()', () => {
            // `found duplicate entity id x`
            // `unknown matrix id x`
        });

        it('addSpecificEntity()', () => {
            // getPid()
            // `found duplicate entity key`
        });

    });

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  MaxtrixEntityBuilder
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('MaxtrixEntityBuilder', () => {
        it('Constructor', () => {
        });
        
        it('hasEntity()/setEntity()', () => {
            // `attempting to overwrite entity`
        });
        
        it('addAttribute()', () => {
            // `unknown attribute x`
        });
        
        it('getPID()', () => {
            // Get unconfigured
            // Get configured generic
            // `no entity set`
        });
    });

});

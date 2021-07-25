import { OPTION } from 'prix-fixe';
import { NumberToken, NUMBERTOKEN } from 'token-flow';

import {
  ATTRIBUTE,
  AttributeToken,
  CONJUNCTION,
  ConjunctionToken,
  ENTITY,
  EntityToken,
  OptionToken,
  UNIT,
  UnitToken,
} from '../../src';

import {
  caffeineDecaf,
  genericCoffeePID,
  genericConePID,
  genericMilkPID,
  sizeMedium,
  sizeSmall,
  flavorChocolate,
  milkSoy,
  caffeineRegular,
} from '../shared';
import { milkWhole } from './small_world';

export const productCone: EntityToken = {
  type: ENTITY,
  pid: genericConePID,
  name: 'ice cream cone',
};

export const productCoffee: EntityToken = {
  type: ENTITY,
  pid: genericCoffeePID,
  name: 'coffee',
};

export const optionMilk: OptionToken = {
  type: OPTION,
  id: genericMilkPID,
  name: 'milk',
};

export const quantityOne: NumberToken = {
  type: NUMBERTOKEN,
  value: 1,
};

export const quantityTwo: NumberToken = {
  type: NUMBERTOKEN,
  value: 2,
};

export const quantityFive: NumberToken = {
  type: NUMBERTOKEN,
  value: 5,
};

export const conjunction: ConjunctionToken = {
  type: CONJUNCTION,
};

export const unitPumps: UnitToken = {
  type: UNIT,
  id: 0,
  name: 'pumps',
};

export const attributeDecaf: AttributeToken = {
  type: ATTRIBUTE,
  id: caffeineDecaf,
  name: 'decaf',
};

export const attributeRegular: AttributeToken = {
  type: ATTRIBUTE,
  id: caffeineRegular,
  name: 'regular',
};

export const attributeSmall: AttributeToken = {
  type: ATTRIBUTE,
  id: sizeSmall,
  name: 'small',
};

export const attributeMedium: AttributeToken = {
  type: ATTRIBUTE,
  id: sizeMedium,
  name: 'medium',
};

export const attributeChocolate: AttributeToken = {
  type: ATTRIBUTE,
  id: flavorChocolate,
  name: 'chocolate',
};

export const attributeSoy: AttributeToken = {
  type: ATTRIBUTE,
  id: milkSoy,
  name: 'soy',
};

export const attributeWhole: AttributeToken = {
  type: ATTRIBUTE,
  id: milkWhole,
  name: 'whole',
};

import { PID } from 'prix-fixe';
import { Item, Token } from 'token-flow';

export const UNIT: unique symbol = Symbol.for('UNIT');
export type UNIT = typeof UNIT;

export interface UnitToken extends Token {
  type: UNIT;
  id: PID;
  name: string;
}

export function unitTokenFactory(item: Item): Token {
  return { type: UNIT, id: item.pid, name: item.name } as UnitToken;
}

export function createUnit(id: PID, name: string) {
  return { type: UNIT, id, name } as UnitToken;
}

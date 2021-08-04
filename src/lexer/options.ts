import { OPTION, PID } from 'prix-fixe';
import { Item, Token } from 'token-flow';

export interface OptionToken extends Token {
  type: OPTION;
  id: PID;
  name: string;
}
export const option = { type: OPTION } as OptionToken;

export function optionTokenFactory(item: Item): Token {
  return { type: OPTION, id: item.pid, name: item.name } as OptionToken;
}

export function createOption(id: PID, name: string) {
  return { type: OPTION, id, name } as OptionToken;
}

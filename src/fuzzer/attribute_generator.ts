import { AID, AttributeInfo } from 'prix-fixe';

import { generateAliases } from 'token-flow';

import { patternFromExpression } from '../lexer';

import { AttributeX, EITHER, Position } from './fuzzer';

import { Random } from './utilities';

///////////////////////////////////////////////////////////////////////////////
//
// AttributeGenerator
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeGenerator {
  private readonly attributes = new Map<AID, AttributeX[]>();

  constructor(attributeInfo: AttributeInfo, positions: Map<string, Position>) {
    for (const dimension of attributeInfo.dimensions()) {
      const position = positions.get(dimension.name) || EITHER;
      for (const attribute of dimension.attributes) {
        const ax: AttributeX[] = [];
        // if (!attribute.hidden) {
        for (const alias of attribute.aliases) {
          const pattern = patternFromExpression(alias);
          for (const text of generateAliases(pattern)) {
            const t = attribute.hidden ? '' : text;
            ax.push(new AttributeX(attribute.aid, t, position));
          }
        }
        // }
        this.attributes.set(attribute.aid, ax);
      }
    }
  }

  get(aids: AID[], random: Random): AttributeX[] {
    const ax: AttributeX[] = [];
    for (const aid of aids) {
      const choices = this.attributes.get(aid);
      if (choices && choices.length > 0) {
        ax.push(random.randomChoice(choices));
      }
    }
    return ax;
  }
}

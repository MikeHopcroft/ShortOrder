import { Graph } from 'token-flow';

import { tokenToString } from '../lexer';

import { Segment } from './interfaces';

// TODO: REVIEW: consider removing this dead code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function printSegment(segment: Segment) {
  const left = segment.left.map(tokenToString).join('');
  const entity = `[Entity: pid=${segment.entity}]`;
  const right = segment.right.map(tokenToString).join('');

  console.log('  Segment');
  console.log(`    left: ${left}`);
  console.log(`    entity: ${entity}`);
  console.log(`    right: ${right}`);
}

// TODO: REVIEW: consider removing this dead code.
export function printGraph(graph: Graph) {
  for (const [i, edges] of graph.edgeLists.entries()) {
    console.log(`  vertex ${i}`);
    for (const edge of edges) {
      const token = tokenToString(edge.token);
      console.log(
        `    length:${edge.length}, score:${edge.score}, token:${token}`
      );
    }
  }
}

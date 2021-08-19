import { State } from 'prix-fixe';
import { filterGraph, Graph, maximalTokenizations } from 'token-flow';

import { Context, Services } from './context';
import { Interpretation } from './interfaces';
import { createInterpretation } from './interpretation';

///////////////////////////////////////////////////////////////////////////
//
// Parsing complete utterances.
//
///////////////////////////////////////////////////////////////////////////
export function processRoot(
  services: Services,
  state: State,
  text: string
): State {
  state = processRootInternal(services, state, text);
  return state;
}

function processRootInternal(
  services: Services,
  state: State,
  text: string
): State {
  // Create token-flow graph of tokens from input text.
  const rawGraph: Graph = services.lexer.createGraph(text);

  // Filter out lower scoring duplicate edges and edges with a score less than 0.35.
  // TODO: REVIEW: MAGIC NUMBER
  // 0.35 is the score cutoff for the filtered graph.
  const filteredGraph: Graph = filterGraph(rawGraph, 0.35);

  //
  // Find the best interpretation from each maximal tokenization
  //

  const context: Context = {
    services,
    state,
    graph: filteredGraph,
  };

  let best: Interpretation | null = null;
  for (const tokenization of maximalTokenizations(filteredGraph.edgeLists)) {
    const interpretation = createInterpretation(context, tokenization);

    // TODO: these counts don't include the intent token.
    interpretation.missed = tokenization.length - interpretation.score; // Missing intent

    if (!best) {
      if (services.debugMode) {
        console.log('Kept first interpretation');
      }
      best = interpretation;
    } else if (preferFirstInterpretation(interpretation, best)) {
      if (services.debugMode) {
        console.log('Found better interpretation');
      }
      best = interpretation;
    }
  }

  if (best) {
    state = best.action(state);
  }

  return state;
}

function preferFirstInterpretation(
  a: Interpretation,
  b: Interpretation
): boolean {
  // ISSUE:
  //   two entities, which concatenated for another entity
  //   e.g. fuzzerB2: 10, simplified
  //     "add a grande chai latte with some water",
  //
  // [ADD_TO_ORDER][NUMBER:1][ATTRIBUTE:GRANDE,4][ENTITY:CHAI_LATTE,305][CONJUNCTION][UNKNOWNTOKEN][OPTION:WATER,1005]
  // [ADD_TO_ORDER][PRODUCT_PARTS_1]
  // Kept first interpretation

  // [ADD_TO_ORDER][NUMBER:1][ATTRIBUTE:GRANDE,4][ENTITY:CHAI_LATTE,305][ENTITY:LATTE,302][CONJUNCTION][UNKNOWNTOKEN][OPTION:WATER,1005]
  // [ADD_TO_ORDER][PRODUCT_PARTS_N]
  // Found better interpretation

  // IDEAS:
  //   tokens used (score)
  //   tokens not used (missed or tokenCount2 - score)
  //   percentage of tokens used (score/tokenCount2)
  //   edit distance to cart

  const aMissed = a.missed!;
  const bMissed = b.missed!;

  // // This actually fails 8 cases in regression.yaml
  // // over using a.missed! and b.missed! Only passes
  // // 844/1000 cases of fuzzerA.yaml
  // const aMissed = a.tokenCount2 - a.score;
  // const bMissed = b.tokenCount2 - b.score;

  if (aMissed! === bMissed!) {
    // if (a.missed! === b.missed!) {
    return a.tokenCount < b.tokenCount;
    // const ra = a.score / a.tokenCount2;
    // const rb = b.score / b.tokenCount2;

    // if (ra === rb) {
    //     // Prefer shorter token sequences
    //     return a.tokenCount2 < b.tokenCount2;    // Original
    //     // return a.tokenCount2 >= b.tokenCount2;      // Experimental
    // } else {
    //     // Prefer higher match ratios
    //     return ra > rb;
    // }
  } else {
    return aMissed < bMissed;
    // return a.missed! < b.missed!;
  }
}

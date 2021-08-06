import { AttributeInfo, Cart, ICartOps, ItemInstance, OPTION } from 'prix-fixe';

import {
  allTokenizations,
  DynamicGraph2,
  Edge,
  Graph,
  Token,
} from 'token-flow';

import { ATTRIBUTE, ENTITY, ILexicalAnalyzer, Span } from '../lexer';

import { OptionTargetBuilder, TargetBuilder } from './entity_builder';

import { HypotheticalItem, SequenceToken } from './interfaces';
import { Context } from './parser';
import { splitOnEntities } from './parser_utilities';

///////////////////////////////////////////////////////////////////////////////
//
// Generating subgraphs
//
///////////////////////////////////////////////////////////////////////////////
export function subgraphFromItems(
  attributes: AttributeInfo,
  lexer: ILexicalAnalyzer,
  cart: Cart,
  graph: Graph,
  span: Span,
  includeProducts: boolean
): Graph {
  const tokens = new Set<Token>();
  for (const item of cart.items) {
    addTokens(attributes, lexer, item, tokens, includeProducts);
  }

  return createSubgraph(graph.edgeLists, tokens, span);
}

function addTokens(
  attributes: AttributeInfo,
  lexer: ILexicalAnalyzer,
  item: ItemInstance,
  tokens: Set<Token>,
  includeProducts: boolean
): void {
  if (includeProducts) {
    // Add entity token
    const pid = AttributeInfo.pidFromKey(item.key);
    tokens.add(lexer.getEntityToken(pid));

    // Add attribute tokens
    for (const aid of attributes.getAttributes(item.key)) {
      tokens.add(lexer.getAttributeToken(aid));
    }
  }

  // Add child item tokens.
  for (const child of item.children) {
    // NOTE: this code assumes a two-level ItemInstance hierarchy,
    // so the recursive call always passes includeProducts = true.
    addTokens(attributes, lexer, child, tokens, true);
  }
}

function createSubgraph(
  edgeLists: Edge[][],
  subset: Set<Token>,
  span: Span
): Graph {
  const filtered: Edge[][] = [];
  for (const [i, edgeList] of edgeLists.entries()) {
    if (i >= span.start && i < span.start + span.length) {
      // Only copy edgelists that are within the span
      filtered.push(
        edgeList.filter((edge) => {
          const token = edge.token;

          if (
            token.type === ENTITY ||
            token.type === OPTION ||
            token.type === ATTRIBUTE
          ) {
            // Entities (products and options) and Attributes
            // are copied if they are in the subset.
            return subset.has(token);
          } else {
            // All other edges are copied.
            // TODO: REVIEW: does UNKNOWNTOKEN only correspond to default edges?
            // Can they be anything else? Perhaps stopwords?
            return true;
          }
        })
      );
    }
  }

  // console.log('Original graph:');
  // for (const [i, edges] of edgeLists.entries()) {
  //     console.log(`  vertex ${i}`);
  //     for (const edge of edges) {
  //         const token = edge.token;
  //         console.log(`    length:${edge.length}, score:${edge.score}, token:${tokenToString(token)}`);
  //     }
  // }
  // console.log('Filtered graph:');
  // for (const [i, edges] of filtered.entries()) {
  //     console.log(`  vertex ${i}`);
  //     for (const edge of edges) {
  //         const token = edge.token;
  //         console.log(`    length:${edge.length}, score:${edge.score}, token:${tokenToString(token)}`);
  //     }
  // }

  return new DynamicGraph2(filtered);
}

///////////////////////////////////////////////////////////////////////////////
//
// Generating targets
//
///////////////////////////////////////////////////////////////////////////////

// TODO: ISSUE: does this return an iterator of HypotheticalItems,
// correponding to ItemInstances in the cart for one Interpretation,
// or for all Interpretations? Issue is that one doesn't want to see
// the same item twice. Is the solution to collect the ItemInstances
// in a Set? This seems wrong because in the case of, say, a remove
// operation with two Interpretations, one want to remove only one
// target.
//
// TODO: a target might also be implicit, if the tokens don't contain
// an entity.
//
// TODO: remove an option from an implicit entity - e.g. 'I removed the decaf'
// TODO: remove an attribute from an implicit entity - e.g. 'I removed the large` - doesn't make sense
// Seems you can change/modify an attribute, but not remove it.
export function* productTargets(
  context: Context,
  span: Span
): IterableIterator<HypotheticalItem> {
  const attributes: AttributeInfo = context.services.attributes;
  const cartOps: ICartOps = context.services.cartOps;
  const lexer: ILexicalAnalyzer = context.services.lexer;
  const cart = context.state.cart;

  if (span.length === 0) {
    return;
  }

  //
  // Construct lexical subgraph corresponding to items in the cart.
  // Subgraph edges will correspond to tokens for items in `cart`.
  //
  const subgraph = subgraphFromItems(
    attributes,
    lexer,
    cart,
    context.graph,
    span,
    true
  );

  // Try each tokenization of the subgraph.
  // Need to look at all tokenizations, not just the top-scoring ones because
  // targets are often partially/poorly specified (e.g. "latte" instead of
  // "cinnamon dolce latte")
  const tokenizations = allTokenizations(subgraph.edgeLists);
  for (const tokenization of tokenizations) {
    // console.log('Tokenization:');
    // for (const token of tokenization) {
    //     const text = tokenToString(token);
    //     console.log(`  ${text}, start=${token.start}, length=${token.length}`);
    // }

    const { entities, gaps } = splitOnEntities(
      tokenization as Array<SequenceToken & Span>
    );
    if (entities.length > 0) {
      // const segment: Segment = {
      //     left: gaps[0],
      //     entity: entities[0].pid,
      //     right: gaps[1]
      // };

      const builder = new TargetBuilder(
        context.services,
        gaps[0],
        entities[0].pid,
        gaps[1]
      );
      const target = builder.getItem();

      // console.log(`  score: ${builder.getScore()}`);

      if (target !== undefined) {
        const tokenCount = gaps[0].length + gaps[1].length + 1;
        // console.log(`  ============ Hypothetical target ${target.key} ==============`);

        // Yield matching ItemInstances from the cart.
        // TODO: we need a predicate that treats unspecified attributes as wildcards.
        // Need to know whether an attribute is default because it was omitted or
        // specified as the default value.
        // Perhaps EntityBuilder needs a wildcard mode.
        for (const item of cartOps.findByKeyRegex(cart, target.key)) {
          // console.log(`    yield key=${item.key}, score=${builder.getScore()}`);
          yield {
            item,
            score: builder.getScore(),
            tokenCount,
          };
        }
      }
    }
  }
}

export function* optionTargets(
  context: Context,
  item: ItemInstance,
  span: Span
): IterableIterator<HypotheticalItem> {
  const attributes: AttributeInfo = context.services.attributes;
  const cartOps: ICartOps = context.services.cartOps;
  const graph: Graph = context.graph;
  const lexer: ILexicalAnalyzer = context.services.lexer;

  if (span.length === 0) {
    return;
  }

  const cart: Cart = { items: [item] };

  //
  // Construct lexical subgraph corresponding to items in the cart.
  // Subgraph edges will correspond to tokens for items in `cart`.
  //
  const subgraph = subgraphFromItems(
    attributes,
    lexer,
    cart,
    graph,
    span,
    false
  );

  // Try each tokenization of the subgraph.
  // Need to look at all tokenizations, not just the top-scoring ones because
  // targets are often partially/poorly specified (e.g. "latte" instead of
  // "cinnamon dolce latte")
  const tokenizations = allTokenizations(subgraph.edgeLists);
  for (const tokenization of tokenizations) {
    // console.log('Tokenization:');
    // for (const token of tokenization) {
    //     const text = tokenToString(token);
    //     console.log(`  ${text}, start=${token.start}, length=${token.length}`);
    // }

    const { entities, gaps } = splitOnEntities(
      tokenization as Array<SequenceToken & Span>
    );
    if (entities.length === 0 && gaps.length === 1) {
      // const segment: Segment = {
      //     left: gaps[0],
      //     entity: entities[0].pid,
      //     right: gaps[1]
      // };

      const builder = new OptionTargetBuilder(context.services, gaps[0]);
      const target = builder.getOption();

      // console.log(`  score: ${builder.getScore()}`);

      if (target !== undefined) {
        // console.log(`  ============ Hypothetical target ${target.key} ==============`);

        // Yield matching ItemInstances from the cart.
        // TODO: we need a predicate that treats unspecified attributes as wildcards.
        // Need to know whether an attribute is default because it was omitted or
        // specified as the default value.
        // Perhaps EntityBuilder needs a wildcard mode.
        for (const item of cartOps.findByKeyRegex(cart, target.key)) {
          // console.log(`    yield key=${item.key}, score=${builder.getScore()}`);
          yield {
            item,
            score: builder.getScore(),
            tokenCount: span.length,
          };
        }
      }
    }
  }
}

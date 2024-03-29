import {
  AttributeInfo,
  ICartOps,
  ICatalog,
  ICookbook,
  IRuleChecker,
  OPTION,
} from 'prix-fixe';

import { NUMBERTOKEN, UNKNOWNTOKEN } from 'token-flow';

import {
  ADD_TO_ORDER,
  ATTRIBUTE,
  CONJUNCTION,
  ENTITY,
  ILexicalAnalyzer,
  OPTION_RECIPE,
  QUANTITY,
  UNIT,
  REMOVE_ITEM,
} from '../lexer';

export class Parser {
  readonly attributes: AttributeInfo;
  readonly cartOps: ICartOps;
  readonly catalog: ICatalog;
  readonly cookbook: ICookbook;
  readonly lexer: ILexicalAnalyzer;
  readonly rules: IRuleChecker;
  readonly debugMode: boolean;

  intentTokens = new Set<Symbol>([ADD_TO_ORDER, REMOVE_ITEM]);

  productTokens = new Set<Symbol>([
    // Product-related
    ATTRIBUTE,
    CONJUNCTION,
    ENTITY,
    OPTION,
    OPTION_RECIPE,
    NUMBERTOKEN,
    // PRODUCT_RECIPE,
    QUANTITY,
    UNIT,

    UNKNOWNTOKEN,
  ]);

  // TODO: Parser shouldn't be coupled to LexicalAnalyzer. It should take an
  // interface to a graph manipulation class or perhaps that code could be
  // extracted from LexicalAnalyzer and exposed as simple functions.
  // TODO: Fix LexicalAnalyzer hack (undefined!) in unit tests.
  constructor(
    cartOps: ICartOps,
    catalog: ICatalog,
    cookbook: ICookbook,
    attributes: AttributeInfo,
    lexer: ILexicalAnalyzer,
    rules: IRuleChecker,
    debugMode: boolean
  ) {
    this.cartOps = cartOps;
    this.catalog = catalog;
    this.cookbook = cookbook;
    this.attributes = attributes;
    this.lexer = lexer;
    this.rules = rules;
    this.debugMode = debugMode;
  }
}

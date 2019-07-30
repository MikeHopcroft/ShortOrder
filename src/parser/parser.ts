import {
    AttributeInfo,
    ICartOps,
    ICatalog,
    IRuleChecker,
    OPTION,
} from 'prix-fixe';

import { NUMBERTOKEN } from 'token-flow';

import {
    ADD_TO_ORDER,
    ATTRIBUTE,
    CONJUNCTION,
    ENTITY,
    EPILOGUE,
    LexicalAnalyzer,
    PROLOGUE,
    QUANTITY,
    UNIT,
    REMOVE_ITEM,
} from '../lexer';

export class Parser {
    readonly attributes: AttributeInfo;
    readonly cartOps: ICartOps;
    readonly catalog: ICatalog;
    readonly lexer: LexicalAnalyzer;
    readonly rules: IRuleChecker;
    readonly debugMode: boolean;

    intentTokens = new Set<Symbol>([
        ADD_TO_ORDER,
        REMOVE_ITEM
    ]);

    validTokens = new Set<Symbol>([
        // Intents
        ADD_TO_ORDER,
        EPILOGUE,
        PROLOGUE,
        REMOVE_ITEM,

        // Product-related
        ATTRIBUTE,
        CONJUNCTION,
        ENTITY,
        OPTION,
        NUMBERTOKEN,
        QUANTITY,
        UNIT,
    ]);

    // TODO: Parser shouldn't be coupled to LexicalAnalyzer. It should take an
    // interface to a graph manipulation class or perhaps that code could be
    // extracted from LexicalAnalyzer and exposed as simple functions.
    // TODO: Fix LexicalAnalyzer hack (undefined!) in unit tests.
    constructor(
        cartOps: ICartOps,
        catalog: ICatalog,
        attributes: AttributeInfo,
        lexer: LexicalAnalyzer,
        rules: IRuleChecker,
        debugMode: boolean
    ) {
        this.cartOps = cartOps;
        this.catalog = catalog;
        this.attributes = attributes;
        this.lexer = lexer;
        this.rules = rules;
        this.debugMode = debugMode;
    }
}

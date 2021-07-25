# TODO List

* Top
  * NEW
    * x Setup code coverage
    * Consider removing concept of WEAK_ADD
    * Redundant code
      * integration/short-order-world2.ts - also use underscores in name
      * lexer/lexical_analyzer2.ts
      * lexer/stemmer2.ts, stemmers/stemmer.ts
    * Rename tokenCount2
    * Patterns
    * x Upgrade GTS, spacing, linter
    * x Take new prix-fixe
    * Investigate two test descriptions with name "parser2"
    * EntityBuilder case: NUMBER ATTRIBUTE OPTION - is this legal?
    * x Switch from travis to github actions
    * Make prix-fixe the source of regression tests
      * Need some way for short-order users to find prix-fixe menu and regression suite.
    * Baseline should reside in prix-fixe
    * Put test suite under control of unit tests
      * x Get test_runner working with new menu.
      * . Return code for failed tests
      * Flag to temporarily suppress tests
        * Need to add this in prix-fixe
        * Publish prix-fixe
        * Take new version
      * Test suite and baseline checked in here
      * node build\samples\test_runner.js ..\PrixFixe\samples\tests\regression.yaml --baseline=..\PrixFixe\samples\tests\baseline.yaml -x
    * Implicit quantifier issues
      * two pump vanilla latte
      * x add to test suite
    * Take latest prix-fixe@61
    * Publish
    * x Clean build
      * x TSLint => ESLint
      * x Upgrade gts
      * x Tabsize = 2
    * Set up code coverage
    * Remove old menu and concept from all samples.
    * Burger menu
    * Pizza menu
    * Take recursive generator expression PR
  * Explore adding new token type: INPUT (vs UNKNOWNTOKEN)
    * What are all of the uses of UNKNOWNTOKEN that are not inputs?
    * Stopwords?
  * Product recipes - e.g. "add a double double"
  * x Stemmer configurations should go in lexicon.yaml.
    * x stopwords - already in lexicon.yaml
    * x snowball
    * x metaphone
    * x singularize
    * x cases 41 and 1027 - due to "iced" vs "ice" after stemming?
  * x Port StemmerFactory to use ILoader.
  * Upgrade gts. TabSize = 2.
  * x LexiconSpec io-ts validation
  * Integrate into createShortOrderWorld, confusion_matrix, and parser.test.ts
  * x Casing for CreateQuantity(), CreateNumber(), other token factory helpers.
  * Definition of ENTITY vs OPTION in lexical_analyzers. One from prix-fix. One local.
  * LexicalAnalyzer
    * x ILexicalAnalyzer
    * x LexicalAnalyzer implements ILexicalAnalyzer
    * x LexicalAnalyzer2 implements ILexicalAnalyzer
    * x Can we make a generatic token file? Special case for making tokens, based on name? (e.g. adding value to quantifier)
    * x Can stopwords become an intent? UNKNOWN_TOKEN
    * Do we even need quantifiers? The only ones defined are "an" and "couple"
  * Remove WEAK_ADD
  * Is order.ts (OrderOps) still used? Where did the functionality go?
  * Refactor createShortOrderWorld for browser
  * Refactor LexicalAnalyzer for browser
  * fuzzer
    * All but fuzzer_main can probably go into core
  * core
    * lexer
    * order
    * parser
    * stemmers
    * stopwords
    * utilities

Parser Map
* processRootInternal()
  * for all tokenizations
    * groupProductTokens()
    * processAllActiveRegions()
      * switch statement on tokens.startsWith
        * processAdd()
        * processRemove()
        * processModify()
          * parseAddToTarget()
            * for targetItem of productTargets()
              * parseAddToItem()
                * ModificationBuilder
          * parseAddToImplicit()
            * for item of state.cart.items
              * parseAddToItem()
          * parseReplaceTarget()
            * createSpan()
            * for targetItem of productTargets()
              * parseReplaceItemWithTokens()
                * splitOnEntities()
                * ReplacementBuilder
                * parseReplaceItem()
          * parseReplace1()
            * splitOnEntities()
            * for splits of enumerateSplits()
              * parseReplaceTarget()
                * for targetItem of productTargets()
                  * parseReplaceItemWithTokens()
                    * (see above)
          * processModify1()
            * splitOnEntities()
            * parseAddToTarget()
              * (see above)
          * parseReplaceImplicit()
            * parserBuildItemFromTokens()
              * parserBuildItemFromSegment()
                * EntityBuilder
            * parseReplaceTarget()
              * (see above)
    * compute interpretation.missed
    * pick best interpretation
      * preferFirstInterpretation()
    * update state

Parser
* Remove concept of weakAdd
* Map a map of the parser call tree
  * Clarify roles of each function
  * Clarify concepts (e.g. targets, spans)
* Consider [nearley.js](https://nearley.js.org/docs/index) parser.
* Investigate preferFirstInterpretation()
  * // Prefer shorter token sequences
  * // return a.tokenCount2 < b.tokenCount2;
  * return a.tokenCount2 >= b.tokenCount2;
* x Is Interpretation.items necessary?
  * x Seems like it's never read.
  * x Seems it is used inconsistently.
* Why Interpretation.action function vs, say, Interpretation.state or Interpretation.cart?
* What is the difference between Interpretation.score and Interpretation.tokenCount2?
  * Score seems to be the total number of tokens used by the various Builders
  * tokenCount2 seems to be the sum of the segment lengths
* What is Interpretation.missed?
* Function for computing edit distance
* Function for picking best interpretation
  * Perhaps preferFirstInterpretation() should be changed to incorporate the if-statement and return the best intepretation.
* Should interpretations be flattened in processAllActiveRegions() or should they be chained?
  * Flattening might be able to catch errors earlier, but there shouldn't be errors.
  * Probably the reason for flattening as we go is that future iterations need the state to interpret targets.

* parser/root.ts
  * // TODO: these counts don't include the intent token.
* Simplified catalog dump - for groups evaluating algorithms
* Fuzzer
  * Consider .filteredGraph command
  * 9215 tokenizations:
    * could you please also do two small chai lattes with shot iced with oat milk three tall cups of drip coffee with a splash of fat free milk cream and oat and a small cinnamon flat white with ice i am ready to pay
  * 1151 tokenizations:
    * hello there can we just also do one double iced ristretto one third caf with heavy on the foam and two splashes of almond two tall mochas with room iced with two packets of sugar in the raw and three double iced three pump orange syrup macchiatoes with heavy on the cinnamon and oat milk that should do it
    * 12 tokenizations: .tokenize hello there can we just also do one double iced ristretto one third caf with heavy on the foam and two splashes of almond
    * 2 tokenizations: .tokenize two tall mochas with room iced with two packets of sugar in the raw and 
    * 48 tokenizations: .tokenize three double iced three pump orange syrup macchiatoes with heavy on the cinnamon and oat milk that should do it
    * Breaking the last one down
    * 4 tokenizations: .tokenize three double iced three pump orange syrup macchiatoes with
    * 12 tokenizations: .tokenize heavy on the cinnamon and oat milk that should do it
      * cinnamon vs cinnamon syrup
      * oat milk vs oat milk creamer
      * oat milk whole milk vs oat milk creamer whole milk vs etc.


  * node build\samples\test_generator.js -t=b -n=1 -s=492
    * where does "extra" in "extra shot" come from?
    * it comes from quantifiers
    * the problem is that shot should not have an option tensor
  * Ambiguity
    * "cinnamon" vs "cinnamon syrup"
    * "almond syrup" vs "almost milk" vs "almond milk creamer"
    * "iced" vs "with ice"
  * Seeds
    * 0: um could you also get me an iced medium three pump buttered rum extra toffee syrup cappuccino with slightly less peppermint and two child milk cup of coffees I'm ready to pay
      * "child" => "child sized"
      * !!! "milk" => "whole milk" - actually the menu is wrong - milk should not be a legal child. Can't change this in the menu without losing the seeded baseline. Will change after fixing other problems.
      * x "cup of coffees" => "cups of coffee" - peephole optimizer
    * 1: hello there may we also get us two small cappuccinos with a pump of orange syrup iced with to go cup we're done
      * NOTE: temporariliy fixed with a post-processing rule
      * "with to go cup" => "in a to go cup"
      * NOW, AFTER CHANGES "and to go cup" => "to go cup"
        * x Fix to that problem yields "iced to go cup"
        * Challenge is that "to go" is "applied", while "to go cup" is something else.
    * 2: OK
    * x 3: ok so may you please also get me three heavy on the toffee syrup iced triple espressos one tall regular caffeine chai latte and a child flat white with  sugar that's it
      * x "with  sugar" => "with sugar"
    * 4: let's see so could you just have three venti cup of dark roasts with non caf iced and two blueberry muffins with butter and warmed how much is that
      * x "with non caf iced" => "non caf iced"
      * x "cup of dark roasts" => "cups of dark roast"
    * 5: all right can you just also get us three blueberry muffins with sliced and warmed one tall iced flat white with two thirds caf three squirts of caramel and nonfat milk and one bran muffin with sliced in two that'll be everything
      * x "with sliced" => "sliced"
      * x "with sliced in two" => "sliced in two"
      * x "sliced warmed" => "sliced and warmed"
    * x 6: okay we need an iced two caffe macchiato with a package of sugar in the raw and some nonfat milk
      * x quantifier "two" - what is this for? Bad alias for "two shot"
    * 7: yeah I will also take one iced venti caffe americano with three packages of equal and half and half and three blueberry muffins with cut in two and warmed we're good
      * x "with cut in two" => "cut in two"
      * x "cut in two warmed" => "cut in two and warmed"
    * 8: okay may I also get me three apple bran muffins with with no butter warmed and extra strawberry three small half decaf latte macchiatoes with  cinnamon syrup iced with three packs of blue sweetener and one quad shot without buttered rum syrup espresso with some half and half that'll be all
      * x "with with" - what is happening here? Attribute is "with no"
      * x "with  cinnamon" => "with cinnamon"
    * 16: howdy there could we also get us three tall latte macchiatoes with split shot and shot and a quad shot caffe lungo with  shot iced we're done
      * x "with split shot" => "split shot"
      * x "and shot" => "and an extra shot"
      * x "with  shot" => "with an extra shot"
      * x "with shot iced" => ???
      * REPL doesn't get this one correct. Problem is with "get us".
      * "with shot" espresso shot should not have option tensor
    * 17: all right could I have three kid's size cappuccinos with for here and one soy iced large flat white I am ready to check out
      * x "with for here" => "for here"
  * Top
    * Enable remove
    * Implement modify
    * Restore verify while generating
    * x -s=seed command line parameter for random number generator
    * "cup of" should be units for coffee, not part of name
      * problem is pluralization: "cup of dark roasts" vs "cups of dark roast"
    * nearly every drink is iced
      * Replacing hidden options with '' leads to double space gaps.
    * shots should not have a tensor
    * options without a tensor should only be quantified
    * with without =? with
    * with/without polarity change introduces "and"
    * with travelling => "travelling"
    * "with wet" => "wet"
    * "with lid" => "with a lid"
    * "with to go cup" => "in a to go cup"
  * fuzzerB:81
    * x Why are all three mutually exclusive milks being added? BUG in rules checker.
    * x Why are they being generated? Same BUG in rules checker.
  * fuzzerC2
    * Investigate long processing times
  * Peephole filter 
    * "with without" => "without"
    * "with extra shot" => "with an extra shot"
    * "with lid" => "with a lid"
    * "with yellow packet" => "with a yellow packet"
    * "that should do all"
    * "slightly less blue packet" - this might be a tensor error - should packets have attributes?
    * shots should not have light, extra, etc. Same for
      * lids
      * warmed
      * cut in half
      * to go
      * for here - recipe?
  * x Suppress "regular" as in "with room regular" - this was "regular caffeine"
  * articles before some singletons and now others. Need idea of quantifiable
    * with a lid
    * cut in half
    * warmed
    * togo
    * with a shot (not with shot)
    * with travelling
    * with caffeinated
    * with none hazelnut
  * No "with" in some cases
    * with warmed
    * with for here
  * Should have conjunction between right attribute and options
    * ah add three venti latte macchiatoes with one third decaf iced (HERE) ice and without sugar in the raw that should be everything
  * Don't fuzz ambiguous options - e.g. "almond milk" and "almond syrup"
  * x Singleton options - e.g. "two pump one third caf", "three pump lid lattes"
  * x Correct units
  * Why are most drinks "small"?
  * Finish porting remove
  * Verify while generating?
  * entity_builder.ts: TODO: BUGBUG: optionTokenCounts is not filtered
  * product_generator.ts: TODO: Verify that option count is legal (e.g. singleton case)
* Singleton options, like the milks and the caffination levels
  * Fuzzer support, as well
* TokenSequence.takeIf takes if peek shows expected token.
* Remove WEAK_ADD
* Does HypotheticalItem.item need to allow undefined?
  * Does optionTargets() every return a HypotheticalItem with item undefined? No.
  * What about productTargets()? Nope.
  * parserBuildItemFromTokens() can return an undefined item. Could this function be changed to a generator?
* Removed cookbook - use functionality from prix-fixe instead
* x Replace `text.split(/\s+/)` with termModel.breakWords()
* x Consider moving loops from tokenizationsFromGraph2() and allTokenizations() to token-flow.
* .targets command in replShortOrder may be broken. Also, can get span from graph.
* Make lexer.createGraph return [terms, graph]
* Remove items property from Interpretation
* Propagate token scores through parser - use for Interpretation.score

Rules explorer


CMU dictionary
Wiktionary
Metaphone
Double Metaphone

Algorithm to generate all top-scoring paths.
  Copy best path
  Examine every forward edge to see if taking it would give as good a path.
  Keep only those edges.
  Then enumerate all paths.
  There could still be other paths with same score. 

Remove option from target or implicit
  remove items field from Interpretation.
  target() becomes targetProduct()
  TargetBuilder becomes TargetProductBuilder
  targetOption
  What if target token is a recipe? How do we search the cart for recipes? Suppose we need to do a tree pattern search.


repl .prefix/.query
  stopped working
  either should trigger update if both values are available
repl .reset logic
bug with "double double", "one and one"
    See note at tokenizer.ts, line 217

recipes/cookbooks
  uids in recipes in prix-fixe
  x recipes roadmap.yaml tests
  x recipes.yaml file
  Recipes class to prix-fixe, create IRecipes
  Creation functions to prix-fixe ICartOps
  lexical analyzer
  parser
  contextual recipes - part of rules file? RID from token run through rules? Want to share aliases, though. Seems like tokens and aliases are associated with RIDs, while there is another ID for recipe templates.
remove to add
  need better name?
  auto-remove?
  add-remove?
  default-remove?
. weak add - check whether "adding" and "added" are stemmed to "add" -   consider collision with "add" attribute.
remove options from target
regression bug 119 - preserve AIDs when changing PID

simplification of rules logic and file format

test suite should print suite statistics in sorted order
play test mode repl extension
incremental test runner mode
test runner stt and transcribed fields
x test runner suite expressions
x boolean expressions for suites
x Lilian's PRs
tryrepl.md, examples.md, menu-ordering.md
process recommendations
stemmer exclusion file
unit tests for repl
take new menu
weak add
remove items not there converts to 'add no'


P1 PREP P0 => parseAddToTarget
PREP P0 => parseAddToImplicit
P0 => parseAddToImplicit

P1 PREP P1 => parseReplaceTarget        // changed the espresso into a latte
PN => parseReplace1                     // make the espresso a latte
P1 => processModify1                    // make the latte decaf
PREP P1 => processReplaceImplicit       // make it a latte


parseReplaceTarget targetTokens replacementTokens
    parseBuildItemFromTokens replacementTokens
        parseBuildItemFromSegment segment
            EntityBuilder
    parseReplaceTargetWithItem targetTokens hypotheticalItem
        for (const target of target())
            parseReplaceItem hypotheticalTarget hypotheticalReplacement
                cartOps.replaceInCart

parseReplace1 partTokens
    splitOnEntities
    for (const splits of enumerateSplits())
        parseBuildItemFromSegment
        parseReplaceTargetWithItem targetTokens hypotheticalReplacement

processModify1
    parseAddToTarget modifierTokens targetTokens

parseReplaceImplcit replacementTokens
    parserBuildItemFromTokens replacementTokens
    parseReplceItem hypotheticalTarget hypotheticalReplacement   



* implict operations need some kind of scoring, based on success of add. come up with test cases for this.

* "i'll add grande iced coffee said no classic and add soy"
    * should add 64:5, not 52:5. Needs to check whether attributed option is legal.

* Confusion matrix in repl

* Extract segment enumeration from parseAdd.
    * splitOnEntities
    * lengths = gaps.map()
    * enumerateSplits(lengths)
    *   segments = entities.map()
* Match pattern for attributed product
* Match pattern for attributed option
* Match pattern for option children

* Add options and attributes
    * (add,added) P0 to [the,that,your] P1
    * (made,changed) [the,that,your] P1 (into,to,with) [a] P0
    * (made,changed) [the,that,your] P1 [a] P0
* Add options and attributes implicit
    * (add,added) P0 [to that]
    * (made,changed) that (into,to,with) [a] P0
* Replace product
    * (made,changed,replaced) [the,that,your] P1 (into,to,with) [a] P1
* Replace product implicit
    * (made,changed,replaced) that (into,to,with) [a] P1
* Remove option or attribute from product
    * (remove,removed,take off,took off) [that,the] P0 from (the,that,your) P1

* modify routines should not attempt modification with sequences like [UNKNOWNTOKEN][UNKNOWNTOKEN][QUANTITY:1][UNKNOWNTOKEN]
* parseAddToExplicitItem()
    * Debug roadmap.yaml failures
    * Scoring Interpretations
    * Return best Interpretation
    * Deal with illegal option additions
    * Deal with duplicate option additions

* x Segment.entity becomes PID
* Segment.entity becomes Key?
* Unit test for groupProductTokens?
* x PRODUCT_[0,1,N]
* x Gathering product-related tokens
* x groupProductTokens - handling UNKNOWN
* Consider eliminating SequenceToken and GapToken

* token-flow
    * NaN score
    * method to copy a graph
    * graph coalesce
    * graph filter
    * approach to inserting default edges
    * keep vertex count from growing on copy
    * default edges as stop words
    * investigate whether stop words are working correctly

* x test_runner print data and time
* x test_runner - processor factory
* x test_runner - flag to skip over intermediate steps -x?
* test_runner - walk over directory tree or get list of file names
* x test_runner just print text - don't run
* x test_runner main function
* test_runner print git head commit hash?
* test_runner aggregate running time across suites
* x test_runner return code
* test_runner option to suppress list of failures
* test_runner match conjunction of suites
* fuzzer add suite names
* x test_runner command line option for single test
* test_runner multi-file option
* fuzzer regression suite in mochajava
* regression script in mochajava

* consider removing Interpretation.items
* review groupProductParts() - can it be combined with other parsing code?
* x consider making targets() take Parser.
* x consider definining a nopInterpretation.
* consider making addCustomStemmer data driven.
* x consider eliminating Tokenization class
* consider making LexicalAnalyzer.[lexicon,token] private
* x utility function to compute span from Token[]
* x targets() should take Span + Graph instead of Tokenization
* x processRoot() generates raw and filtered graphs
* x processActiveRegions() receives both graphs
* x processRemove() receives raw graph
* x Graphs grow by one vertex in each filtering stage.

* consider scoring Interpretations with total span, instead of total tokens
* consider removing action() from Interpretation - replace it with state
* alright that will be $x ...
* alright I will see you at the window/register ...
* Remove extra tokenization methods from lexer
* x Improve performance of graph fragment copy in processAdd()
* x Enumerate all interpretations at top level
* x Interpretations should run and store state?
    * Is this reasonable? Only across intents.
    * Could cache new state when necessary.

* rename tokenizations2()
* tokens for prologue and epilogue
* restructure outer loop
    * regexes?
    * token-flow with @tokens
    * ability to generate tokenizations for fragments of the path
        * idea is to create one graph, segment by intent, then generate tokenizations for products
        * need to either speculatively execute interpretations or actually execute
        * trade-off is the level at which we generate tokenizations
    * full speculative execution vs different tokenizations and interpretations

* REPL .random or .randomCart feature for testing removal
* REPL .push/.pop cart for reusing a cart
* In REPL, reinstate `.menu <item>`
* Fuzzer target simplification
* x LexicalAnalyzer: index tokens
* x EntityBuilder: generate regexes
* x CartOps: search with regex
* OptionToken: rename id to pid

* Consider factoring graph operations from tokenizer in LexicalAnalyzers
  * Examine the need for tokenizer in equivalentPathsRecursion2(). Seems to be for number tokens.
  * Could we just build a graph of tokens? Downside is that we couple Graph to Token 
* Remove Iterpretation.items property - update unit tests
* x Break parser.ts into multiple stages/files.
* x Remove attributes, catalog directories.

* Target search architecture
    * x LexicalAnalyzer needs to provide the graph, the edge list, and the tokens to allow for reprocessing.
    * x Need some way to copy subgraph of edges in the cart.
    * x Need some way to get tokens for everything in the cart - products, options, attributes
    * x Need to know which other edges to copy
    * x What about default edges? Are these added by the Graph constructor
    * x Need some way to run path algorithm on subgraph.
    * Need interpretions for each sort of action: add, remove, modify

* x REPL: Replace .menu with .products and .options
* Add processor factory to test_runner and repl_main
* x createWorld() and createShortOrderProcessor() should not be in fuzzerMain
* rename fuzzer.ts

* Item removal
    * Interpretations for each sort of action: add, remove, modify
    * Query data structure
    * Query execution
    * Parser check for more than one product in parts

* Item removal fuzzing
    * Item name generalizer based on term frequency and stop words
    * Target item searching
        * Keys with wildcards: 407:*:1
        * Keys with options: [407,408]:0:1
        * Keys with differnt tensors: [407:*:1,408:1:2:3]
        * Children/options
        * Key builder - group by tensor
    * those vs that peephole fixup based on quantity

* x Alias collision detection tool
* x Suppressing 'add', 'hot', 'regular'?
    * x This is just an attribute.yaml issue.
    * x Document all hand-authored changes to attributes.
* x Enforcing mutual exclusion in fuzzer
* Units for options, by CID?
* LEFT, RIGHT, EITHER for options, by CID?
* x short-order uses graph api
* x generate removals

* NEW
    * quantified: NEVER, DEFAULT, ALWAYS
    * units?: text
        * option pluralized when no units
    * customize/provide left and right quantifiers
    * customize/provide units
    * issue of 'some' with 'units' - 'some' never gets units
    * positional name editor (e.g. remove syrup for LEFT)
    * x select products from menu
    * x select options from menu
    * x legal options of products
    * unifiy EntityGenerator and OptionGenerator

* REMOVE attributeInfo['tensorIdToTensor']
* TestSuite
    * Rebasing support for TestSuite
    * Return code for TestSuite
    * TestSuite app
    * x Measure and report min, max, mean, percentile latency
    * Return code
* Parser2
    * Figure out how to reintroduce implied quantifiers. Then revert unit test changes. Parser change introduced in 8bbd7455.
    * x Group EntitySequenceTokens
    * x Add to order
    * Remove
    * Restate
    * Start over
* Fuzzer2
    * Document usage in README.md
    * x Command-line argument - save failures only
    * x Create EntityGenerators from menu inspection
    * x Create OptionGenerators from menu inspection
        * Need some way to annotate whether they are quantifiable
        * Need some way to annotate with units
    * Better menu and rules file
        * x latte, cappuccino, americano
        * x specific product for each milk
        * x exclusion set for milks
        * x syrups
        * extra, light, no/without, add
    * Remove old code.
        * fuzzer2
    * Only generate from items with aliases
    * ProductGenerator - random number of options
    * Select valid option for entity
        * Use category id
        * Mutual exclusivity
        * This might be ProductGenerator.
        * Remove milk options from espressos once this is done.
    * x Update to latest token-flow
    * x Write out generated tests.
    * x Command-line argument: -o file, -v (verify), -n count
    * x Option to select LUIS version vs short-order
    * x Publish
    * Integrate into other repo

    * x Sample generator for a single segment with attributes and a quantifier
    * Prevent quantifiers on milks
    * Consider combining EntityX and OptionX
    * Clean up test_generator_demo3.ts.
    * x Alias transformer/detector for left/right options
        * x e.g. filters "syrup" out of left side use cases
    * x Ability to generate utterances without options/attributes
    * x ProductGenerator: make Quantified and Attributed options
    * x Left and right quantifiers for OptionsGenerator
    * Composite generator (templated)
    * Concept of LEFTMOST for size attributes
        * Perhaps use a number instead of a symbol?
    * Go back to "with" after an attribute, even after first "with"
    * "with" and "without"
    * x One-line output
    * Automatically grab prologues and epilogues from intents.yaml (or lexicon)
    * use instanceOf
    * REVIEW aliasesFromOneItem() - does this deal with matcher: prefix?
    * REVIEW generateAliases() and other token-flow imports. Can these come from prix-fixe?

    * x Processor configuration function.
    * x Test running module
    * x OrderX is sequence of SegmentX | WordX
    * x OrderX inserts conjunctions
    * x OrderX holds prologue, epilogue.
    * x Fuzzer runner - parameterized by Processor function
    * Examples
        * one two percent latte
        * (vanilla cream latte)
        * (vanilla cream) latte
        * vanilla cream latte
    * x Make fuzzer3 directory
    * x Don't render isHidden attributes
    * x Seems like LEFT, EITHER, RIGHT should go in OptionX, not QuantityX.
    * Separate options from EntityX?
        * x Rename EntityX to ProductX
        * x EntityX becomes container for QuantityX, key, text, AttributeX[]
        * x ProductX is container of EntityX and OptionX[].
        * x EntityX generates ProductX.
        * x ProductX generates SegmentX
    * x Aliases for attributes
    * Random generators
        * Random generic in category? in list of pids?
        * Attributes for tensor
        * Select n options from category

* Minimal menu to get started
    * x Fix milk attributes
    * Remove modifiers?
    * x attributes
        * x remove isDefault?
* x Hookup new parser
    * x LexicalAnalyzer should consume a prix-fixe World.
* x Test harness from prix-fixe
* x Test harness drives new parser
* x Test cases
* Test suite rebasing
* Repl
* Rehabilitate alias collision detection tool

* Fuzzer
    * x Port to prix-fixe
    * Adopt segmentation model
    * Consider moving to prix-fixe

* Notes
    * RandomOrder - takes prologue, RandomProducts, epilog and stitches together
    * RandomProducts
        * Walks over catalog producing EntityGenerator for each ItemDescription
        * Walks over dimensions producing ModifierGenerator for each Dimension
        * Walks over list of option PIDs producing OptionGenerator for each option PID
        * Stitches together random entity, modifier, and option.
        * Calls ProductGenerator to produce BasicInstance[]
        * Permutes product
        * Complete product
        * Returns ProductInstance
    * ProductGenerator extends CompositeGenerator
        * Permutes
        * Completes (linguistic fixup)
        * Adds entity quantity to the front
    * EntityGenerator
        * Expands aliases of quantifiers
        * Enumerates all combinations of attributes cross product all quantified versions of all entity aliases.
    * ModifierGenerator
        * Obsolete - was used with modifiers
        * Need something that enumerates all options in an exclusion set.
    * OptionGenerator
        * For one PID, enumerates and stores cross product of all aliases and quantity aliases.
* New concepts
    * Distinguish between left and right quantifiers
        * size never/rarely comes to the right
        * one word options like `nonfat` can be trailing more often than two word modifiers like `nonfat milk`
        * right side has phrases like "pumps of" while left side has "pump"
        * right side has words like "a" and "some"
        * left
            * two two pump raspberry lattes
            * `two one pump raspberry lattes` or `two raspberry lattes`
        * right
            * two lattes with two pumps raspberry [syrup]
            * two lattes with [(a pump,some,one pump)] raspberry [syrup]
    * Option attributes
    * Exclusion sets when using multiple options
        * RuleChecker: enumerate exclusion sets and options within exclusion sets
* Plan
    * x Work on clone in fuzzer2 directory
    * x Port onto prix-fixe
    * Merge EntityGenerator and OptionGenerator.
    * Fix obvious test failures
        * Parser support for intents. HACK.
        * Only generate legal options.
    * Enhance rules checker to enumerate legal options
    * Enhance left/right
    * Make sprint4 version - attributes, quantity, entity

* Rename unified directory
* Remove references to old unified

* prix-fixe integration
    * products.yaml
    * options.yaml
    * modifiers.yaml
    * attributes.yaml
    * rules.yaml
    * LexicalAnalyzer
        * x calls prix-fixe setup.
        * x ingests aliases from catalog, attributeInfo
        * x Rename to Tokenizer? TokenizerPipeline? LexicalAnalyzer? TokenizationStage?
    * parser2
        * x uses output of LexicalAnalyzer
        * NumberToken vs QuantifierToken
        * Multiple edge interpretations for top scoring edges (e.g. "extra" as QUANTIFIER or ATTRIBUTE)
    * recipes
        * enumerating aliases
        * AttributeInfo.getKey()
        * cartOps2

* fuzzer


* Synthetic test suite / simulator
    * What is legal?
    * What is not legal?
    * Issue with leading/trailing attributes
    * 'and' triggered by multi-word modifiers?
* Refactoring
    * package structure
        * Lexical analysis: token-flow
        * Parsing, segmentation, composite entity extraction: short-order
        * Menu, Rules checking, Cart updates
            * le-menu
            * prix-fixe
        * Integration
            * REPL
            * (Cart, string) => (Cart', Actions)
        * Consider multiple packages in single repo?
    * token-flow
        * Examine all short-order imports from token-flow
            * keep
                * Token
                * generateAliases()
                * NUMBERTOKEN
            * Maybe
                * UNKNOWNTOKEN - what is this used for?
            * remove
                * PID - where does this definition go in short-order?
                * Item
        * Examine token-flow exports of types no-longer imported by short-order
            * These should probably go into token-flow samples
        * Remove coupling via Item
            * Looks like Item is just used to define token-factories
            * YAML files based on local IndexableItem which has no formal relationship with item. Duck typed.
        * Remove coupling via PID
        * Extract stand-alone relaxed matcher
    * short-order
        * standalone CartOps and menu
        * consider removing choices - or just leave and don't use
        * consdier removing substitutions - or just leave and don't use
        * fake menu generator tools
        * separate CartOps API from parser
        * separate CartOps find methods from update methods
        * remove prices
        * mutual exclusivity
        * rules checker
    * prix-fix
        * test-harness
            * lives in prix-fix or short-order?
            * runs on Cart or Order?
            * Don't compare text names.
    * MochaJava
        * Order probably belongs here
            * Does Host use Order today?

* Bugs
    * 'with', 'and' ends entity before all attributes
        * get me a ice cream cone with one squirt raspberry medium chocolate and fat free milk and that will do it
        * could I get a strawberry cone whole milk with two squirts of hazelnut and large and that'll do it
        * I would like two ice cream cones without raspberry syrup whole milk small strawberry that will be all
    * createInstancesRecursion() needs to expand attribute aliases.
    * detects word(low) - THIS IS REALLY WEIRD - TOKENIZER ISSUE
        * .tokenize I will do a low fat milk latte halfcaf small iced with some raspberry that will be all
    * 'no' might be suppressed
        * please get me one no hazelnut low fat milk medium latte decaf thanks
        * I'll get two whole lattes without raspberry iced large thanks
    * Get tripped up by 'and'?
        * "I'll get one latte fat free milk large with two pumps hazelnut syrup and halfcaf and that will do it"
    * x isomorphic tree comparison

* speech to text filter false positive for lowercasing, e.g. "I will have a halfcaf low fat milk small hazelnut latte thanks"
* In attributes.yaml, there is no good way of identifying dimensions used as modifiers.
* Update documentation
* Fuzzer
    * Intersting cases
        * could I get a without any hazelnut syrup medium latte iced halfcaf that will be all
        * I'd like two one pump raspberry syrup two percent ice cream cones small vanilla and that'll be all
        * I will have a halfcaf low fat milk small hazelnut latte thanks
        * I'll get two whole lattes without raspberry iced large thanks
    * Remove PermutationGenerator???
    * Issues
        * Bug? with before entity. Looks like permutation happing after addQuantity
            * I'd like one pump raspberry syrup with two percent ice cream cones vanilla two small and that'll be all
        * size after option
            * please get me low fat milk latte no hazelnut with one decaf medium thanks
    * Create fuzzer folder
    * Convert RandomProducts into a generator
    * Apply permutations
    * x expand aliases for entities
    * only generate legal modifiers and options
    * option quantities include units that should be consistent with the options
    * some options are not quantifiable
    * x issue with entity quantity and pluralization - should quantity be in the entity?
        * x Seems like it should be for render to cart.
        * x Consequence: remove QuantityInstance. Replace with Word after permutation.
    * share alias expansion for option quantities across OptionGenerators
    * OrderGenerator
    * x PrologueGenerator
    * x EpilogueGenerator
    * x QuantityGenerator
    * x ProductGenerator
    * Units
        * x Aliases for units
        * Data-driven from file?
    * Render as text
        * a/an
        * pluralize entities - need to handle multi-word entities
        * x with A B and C
        * no with before without
    * Render as test case
    * x Quantities for entity
    * x Intro text
* CreateAttribute(), etc. should not use 'as' to cast type. Specify return value instead.
* x test_importer not adding 'unverified' to suites.
* x Speech-to-text filter does replacements after filtering punctuation
    * x Unit tests
* IndexibleItem should be related to Item by extension
* x Remove unused sample data.
* Test suite should not compare item names, just quantities and PIDs.
* Plan for leading options.
    * x Quantified leading options "three five pump pumpkin decaf lattes"
    * Annotations for quantifiable? Or is this in the menu's min/max quantities.
    * x Options really need to be part of the menu (or at least reference items on the menu) insteqd of in a separate file.
* Attributing options - e.g. extra vanilla syrup, add vanilla syrup, etc.
* Fuzzer - generate machine verifiable TestCase permutations


* Check for duplicate defaults in dimensions
* Prepositions for restating
* Entity sets
* Simplify repl_demo
* Simplify parser_demo, rename to parse_text_demo
* parse_tokens_demo
* New repo with sample application
    * ~~Make version of Parser that doesn't require Token-Flow.~~
    * Test suite that checks cart for one utterance
    * Menu
        * One matrix
        * Lots of matrixed entities
        * Lots of additions, notes, etc.
    * Attributes
    * Intents
        * Add new patterns for add-to-order.
    * Quantifiers
* Rename `Unified`?
* Merge mhop-matrix into master
* Publish package.

* Sort out debug package dependency.
* relevance_demo_english
    * Reinstate HackedStemmer.
* Consider replacing ansi-styles with chalk

* ~~Remove dead code from matrix.ts~~
* ~~Update Order to show PIDs~~
* ~~OK. Parser shouldn't construct CartOps - this should be passed in. Parser shouldn't know about formatting options.~~
* Pluggable parser for run_repl and others? Pluggable catalog?
* ~~BUG/ISSUE: entity keys are not unique across matrices. (e.g. cone and latte both have key 0)~~
* ~~BUG/ISSUE: parse doesn't support multiple matrices~~
* ~~concept of no attribute. e.g. diet coke vs coke~~
* ~~Matrix configuration~~
    * ~~Finish up unit tests.~~
    * ~~Rework for attributes~~
        * ~~attributes2.yaml~~
        * ~~Schema for Dimensions, AttributeItem, Matrices~~
        * ~~Catalog analog for AttributeItems. Loader, alias enumerator.~~
            * ~~Constructor takes Attributes~~
        * ~~Load AttributeItems into Unified~~
        * ~~Load Matrices into AttributeInfo~~
        * ~~Load Dimensions + AttributeItems into AttributeInfo~~
        * ~~Load generic entities (catalog items with matrix) into attributeInfo~~
        * ~~Load specific entities (catalog items with key) into attributeInfo. key field~~
        * ~~aliasesFromYamlString()~~
        * ~~token-flow: itemMapFromYamlString() - perhaps add own version to ShortOrder.~~
        * ~~schema.ts~~
        * ~~Where do generic entities go? Can they go in the catalog? Probably with a new field. maxtrix = MID~~
    * ~~Where does AttributeItem belong?~~
    * ~~Loader for Dimensions file w/AJV.~~
    * ~~X Replace attributes.yaml with dimensions.yaml.~~~
    * ~~Modify unified to use AttributeInfo.~~
    * ~~Replumb attributes in parser.~~

* ~~Integrate token-flow 0.0.28~~
    * ~~NUMBERTOKEN vs QUANTITY~~
        * ~~Rename NUMBERTOKEN to NUMBER? No~~
        * ~~x Replace each NUMBERTOKEN with QUANTITY~~
    * ~~Publish 0.0.29. Pick up from npm instead of local.~~
    * ~~parser_Demo~~
        * ~~"hi there give me uh a coffee with two creams" gives one cream.~~
    * ~~parser.ts~~
        * ~~Clean up imports~~
    * ~~WORD and WordToken~~
        * ~~Are these still used by ShortOrder? YES~~
        * ~~Are they still used by TokenFlow?~~
        * ~~Relationship to UnknownToken? ShortOrder replaces UnknownToken with WORD~~
    * OK action


* Bugs
    * BUG: parser_demo "i'll also take I don't know a surf n turf" => "Not sure I got all that..."
    * BUG: fix Spanish relevance cases.
    * BUG: hamburger extra pickles does not add pickles
    * BUG: six piece wings wings wings adds separate two wing sauce line items
    * ~~BUG: start with empty cart. "no burger". Adds a line item for 0 burger.~~
    * BUG: start with empty cart. "fries" gives attribute "fried" which leads to "I didn't understand"
        * Could fix with the stemmer since we're seeing the fried vs fries issue.
        * Could fix with the graph API.
        * Alternate repro: "give me a burger fries and a coke" yields a buger and a coke, no fries.

* Tokenizer REPL
    * @debug command

* Parser REPL
    * .debug command
    * x @tokenize command
    * .restart command
    * Async messages from timer
    * Auto complete - either disable or implement.

* Cart operations
    * Separate finding items, matching some criteria from operating on these items.
    * Search for matching entities.
    * Search for matching categories/attributes.
    * Splitting non-singleton item instances when modifying one.
    * Pronoun heuristics and support (last item added, last n, etc.)
    * BUG: adding second cheeseburger in cart_demo adds a new line item.
    * Distinction between increasing the quantity and setting the quantity.
    * Merging two menu items when their modifications become identical
    * Sort out number of choice items to add under multiples (e.g. 2 surf n turf needs 2 drinks)
    * Scenario: customize one sandwich in surf-n-turf.
    * Scenario: wings come with choices for 2 or 4 sauces. How to fill these.
    * Scenario: 'bbq sauce' means 'bbq dipping sauce' for wings and 'bbq sauce' ingredient for Dakota Burger. Similar with ketchup packet and ketchup ingredient.
    * Scenario: 'Chicago dog no bun' - which bun do we remove? Is bun a category? 'Chicago dog no salt' - means no celerey salt.
    * Undo/go back.
    * Friendly names for products: "Got it. What sauce would you like with your 12 Wings?" vs "Got it. What sauce would you like with your wings?"

* Prepare to receive answers to questions
    * What beverage would you like with your surf n turf?
    * Is that all?
    * Would you like onion rings with that?
    * What flavor frappe?
* Categories (e.g. flavor, size, etc.)
    * Default values
    * Change one value to another. (e.g. chocolate frappe make that a vanilla)
* Pronouns
    * e.g. one of them, both of them, all of them, the other
    * make the frappe chocolate, the frappe should be chocolate
* Restate

* Turn
    * Presumptive close

* Host
    * Timer initiated actions

* Client
    * Display order
    * Display menu
    * Display resonse
    * Text box

* x Parser functions should process and return state consisting of the cart and a list of actions.
* x Actions should be defined as interfaces (vs strings) so they can be processed further (e.g. sort, select top, render into text, etc.)
* x Unit tests for CartOps: update and format methods.
* x Recording errors in action list
* Unit tests for Order: formatting
* Sort out pricing for options - option list price or entity price
* Menu
    * Prices for everything
    * register tape names
* Check for legal quantities
* More intents
    * x More time
    * x End order
    * Replace
    * Substitute
    * x Start over
* Pluggable sales tax.



## More Cases

* Differentiating between setting quantity and adding to quantity
    * Give me a cheeseburger give me a cheeseburger
        * Should order two cheeseburgers?
    * Give me a cheeseburger also give me a cheeseburger
    * Give me a cheeseburger give me two cheeseburgers
        * Should this order two or three cheeseburgers? Probably three.
    * Give me a cheeseburger give me two more cheeseburgers
    * Give me a cheeseburger make that two cheeseburgers
    * Give me a cheeseburger with no pickles actually make that extra pickles
* Pronouns
    * Give me two cheeseburgers one with no pickles and the other with swiss
    * Give me two cheeseburgers one with no pickles and both with extra onions
    * Give me two cheeseburgers both with swiss
    * Give me two cheeseburgers and add pickles to one [of them]
    * Give me two cheeseburgers and add pickles to both/all [of them]
    * Give me two cheeseburgers and no pickles on either/any of them
    * Give me three cheeseburgers and add pickles to one of them and extra onions to the others
    * Give me a cheeseburger and a coffee make the cheeseburger with no pickles
    * Give me a cheeseburger and a coffee make that with no pickles
    * Give me two cheeseburgers and a coffee make one cheeseburger with no pickles and the other with swiss
* Distributing quantifiers
    * Give me a cheeseburger with no pickles and onions
        * No applies to both pickle and onions
    * Give me a cheeseburger with extra pickles and onions
        * Extra applies to both pickles and onions
    * Give me a cheeseburger with two pickles and onions
        * Two applies to pickles, but not onions?
* Inferring object from other object context
    * Give me half a dozen wings with bbq sauce actually make that a dozen
        * Change of product. “dozen wings” implied by word “dozen” in the context of “half dozen” wings.
        * This looks like an example of changing the quantity, but in this case the different sizes are actually different products.
* Categories and Attributes + Pronouns
    * Give me two frappes make one of them chocolate and the other coffee
        * Also how to disambiguate between product `coffee` and flavor `coffee`?
    * Give me two frappes one chocolate and the other coffee
    * Give me two frappes the first chocolate and the second coffee
    * Give me two frappes actually make them all large
    * Give me two frappes make them all large
* Distinguishing similar items from context
    * Give me fries with ketchup and a cheeseburger with ketchup
        * First modification is top-level “ketchup packet” and second is “ketchup” ingredient.
    * Give me six wings with bbq sauce and a cheeseburger with bbq sauce
        * First modification is choice of “bbq dipping sauce” and second is “bbq sauce” ingredient.
    * Give me six wings and a cheeseburger both with bbq sauce
    * Chicago do no bun
        * Want to remove the `poppy seed bun` not the `frankfurter roll`.
    * Big Apple Burger no cheese
        * Want to remove the `American Cheese Slice` vs some othe cheese.
        * Is cheese actually a category where the type is an attribute (e.g. type is one of `American`, `Cheddar`, `Monterray Jack`, `Swiss` just like flavor is one of `chocolate`, `coffee`, and `vanilla`)
* Slot filling
    * Give me six wings with bbq sauce and ranch
        * Filling two slots
* Restate (changing one item into another, changing quantity)
    * Give me a cheeseburger and a coffee make the cheeseburger a Big Apple Burger
    * Give me two cheeseburgers make the first cheeseburger a Big Apple Burger
    * Give me two cheeseburgers make the first a Big Apple Burger
    * Give me a cheeseburger and a coffee actually make that two cheeseburgers
        * Increase the quantity of cheeseburger
* Corrections
    * The frappe should be chocolate


Performace
~~~
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
Time: 1783.9489ms
  "all right I will also have one kid size three squirt orange syrup one percent latte macchiato with some cinnamon two medium soy milk chai lattes without shot and three small chai lattes with soy milk and iced I am done"
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
Time: 569.711599ms
  "um I will also do one iced tall decaf chai latte with foam and soy a double caffe macchiato with three splashes of whole milk a splash of coconut milk and half and half and three four shot caffe macchiatoes for here I am done"
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
Time: 3215.0473ms
  "ah I'll also get a triple caffe espresso iced for here cup with ice and a splash of almond milk one large americano iced with ice and some soy milk and three short latte macchiatoes with room a package of raw sugar and two percent we're ready to pay"
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
Time: 2172.068299ms
  "ah may I please have three quadruple shot caffe lungos with a pump of toffee syrup and a splash of two percent milk one triple caffe espresso with a splash of soy milk easy peppermint syrup and with no whip topping and two grande drips with lid and iced that will be everything"
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
Time: 4042.8841ms
  "could you please also do two small chai lattes with shot iced with oat milk three tall cups of drip coffee with a splash of fat free milk cream and oat and a small cinnamon flat white with ice I am ready to pay"

~~~


Correctness
~~~
---------------------------------------
944: synthetic
  step 0: NEEDS REPAIRS
    customer: let's see we'll have an one shot caffe macchiato with a shot iced with three dashes of nutmeg and water three small espressos with a shot and two two percent milk tall rum syrup caffe latte macchiatoes with light raw sugar and iced that should be everything

      1 iced solo macchiato (1304)                1304
        1 espresso shot (6902)                    6902
        3 nutmeg (5402)                           5402
        1 water (5602)                            5602
      3 solo espresso (1000)                      1000
      1 iced tall latte macchiato (703)            703
        1 espresso shot (6902)                    6902
        2 two percent milk (3200)                 3200
        1 buttered rum syrup (1702)               1702
        1 light sugar in the raw (6701)           6701

      id(11182): insert default item(espresso shot)
    id(11176): change item(iced tall latte macchiato) quantity to 2
      id(11178): change item(two percent milk) quantity to 1
      id(11180): delete item(espresso shot)
---------------------------------------
887: synthetic
  step 0: NEEDS REPAIRS
    customer: hello can we please have three two shot caffe lungos dry with a package of brown packet and two extra shot

      3 doppio lungo (1101)                       1101
        1 dry (6100)                              6100
        1 sugar in the raw (6702)                 6702
        1 extra espresso shot (6903)              6903

      id(10520): change item(extra espresso shot) quantity to 2
      id(10520): change item(extra espresso shot) attribute "extra" to "regular"
---------------------------------------
877: synthetic
  step 0: NEEDS REPAIRS
    customer: ok so may I please get me two small dark roasts with three splashes of zero percent milk and an extra shot that will be all

      2 tall dark roast coffee (1501)             1501
        3 nonfat milk creamer (4300)              4300
        1 extra espresso shot (6903)              6903

      id(10393): change item(extra espresso shot) attribute "extra" to "regular"
---------------------------------------
FIXED. Fuzzer problem. This was a bad QuantityX in test_generator.ts.
765: synthetic
  step 0: NEEDS REPAIRS
    customer: yeah so can we just have three three sprinkles nutmeg tall less vanilla half decaf mochas iced and two bran muffins warmed with strawberry jam I'm done

      3 iced tall mocha (803)                      803
        3 nutmeg (5402)                           5402
        1 light vanilla syrup (2501)              2501
        1 half caf (2800)                         2800
      2 apple bran muffin (10000)                10000
        1 warmed (200)                             200
        1 strawberry jam (102)                     102

      id(9023): change item(nutmeg) quantity to 4
---------------------------------------
Suspected fuzzer problem
642: synthetic
  step 0: NEEDS REPAIRS
    customer: hi there may I just have three without peppermint syrup grande cappuccinos iced non caf with two extra shot and one kid's size cappuccino with easy on the orange syrup almond milk and almond bye

      3 iced grande cappuccino (404)               404
        1 no peppermint syrup (2200)              2200
        1 decaf (3000)                            3000
      2 short cappuccino (400)                     400
        1 extra espresso shot (6903)              6903
        1 light orange syrup (2101)               2101
        1 almond milk (3700)                      3700
        1 almond syrup (1602)                     1602

    id(7525): change item(short cappuccino) quantity to 1
      id(7529): delete item(extra espresso shot)
      id(7540): insert default item(espresso shot)
      id(7540): make item(espresso shot) quantity 2
---------------------------------------
616: synthetic
  step 0: NEEDS REPAIRS
    customer: let's see so may you just get us two no caramel quad shot caffe espressos with an extra shot and one third caf one double caffe lungo iced with sugar and one kid size caffe latte macchiato with lightly splenda that'll do it

      2 quad espresso (1003)                      1003
        1 no caramel syrup (1800)                 1800
      1 iced doppio lungo (1105)                  1105
        1 extra espresso shot (6903)              6903
        1 one third caf (2900)                    2900
        1 sugar (6602)                            6602
      1 short latte macchiato (700)                700
        1 light splenda (6501)                    6501

      id(7177): insert default item(one third caf)
      id(7178): insert default item(espresso shot)
      id(7170): delete item(one third caf)
      id(7172): delete item(extra espresso shot)
---------------------------------------
587: synthetic
  step 0: NEEDS REPAIRS
    customer: ah could you have one tall non caf latte macchiato with three extra shot and almond that'll do it

      1 tall latte macchiato (701)                 701
        1 decaf (3000)                            3000
        1 extra espresso shot (6903)              6903
        1 almond syrup (1602)                     1602

      id(6806): delete item(almond syrup)
      id(6811): insert default item(almond milk)
      id(6808): change item(extra espresso shot) quantity to 3
      id(6808): change item(extra espresso shot) attribute "extra" to "regular"

~~~
From Oliver. Not a legal specific

% add an iced grande latte

  1 iced grande latte (604)                302:1:2

% make that short

  1 UNKNOWN(302:1:0) (undefined)           302:1:0

%   

% add an iced venti latte

  1 iced venti latte (605)                 302:1:3

% make that hot

  1 UNKNOWN(302:0:3) (undefined)           302:0:3

% 
~~~

----
~~~
node build\samples\test_runner.js ..\PrixFixe\samples\tests\regression.yaml --baseline=..\PrixFixe\samples\tests\baseline.yaml -x
~~~

Issues related to adding PRODUCT_0,1,N:

Allowing PRODUCT_0, PRODUCT_1, PRODUCT_N:
~~~
49.1: OK => FAILED(1)
52: OK => FAILED(1)
54.1: OK => FAILED(1)
56: OK => FAILED(1)
57: OK => FAILED(1)
61.1: OK => FAILED(3)
62: OK => FAILED(2)
63: OK => FAILED(2)
1001: OK => FAILED(1)
1006: OK => FAILED(1)
1021: OK => FAILED(1)
1023: OK => FAILED(1)
1025: OK => FAILED(1)
1026: OK => FAILED(1)
1028: FAILED(2) => OK
1030: FAILED(1) => OK
1031: FAILED(1) => FAILED(2)
~~~

Allowing PRODUCT_1, PRODUCT_N:
~~~
61.1: OK => FAILED(3)
62: OK => FAILED(2)
63: OK => FAILED(2)
1028: FAILED(2) => OK
1031: FAILED(1) => FAILED(2)
~~~

Allowing implicit quantifiers (entity_builder.ts, line 384)
  * this.processLeft(new TokenSequence<GapToken>(segment.left), /* false */ true);

~~~
29: FAILED(1) => OK
1028: FAILED(2) => OK
1030: FAILED(1) => OK
~~~
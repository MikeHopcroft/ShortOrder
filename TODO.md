# TODO List

* NEW
    * quantified: NEVER, DEFAULT, ALWAYS
    * units?: text
        * option pluralized when no units
    * customize/provide left and right quantifiers
    * customize/provide units
    * issue of 'some' with 'units' - 'some' never gets units
    * positional name editor (e.g. remove syrup for LEFT)
    * select products from menu
    * select options from menu
    * legal options of products
    * unifiy EntityGenerator and OptionGenerator

* REMOVE attributeInfo['tensorIdToTensor']
* TestSuite
    * Rebasing support for TestSuite
    * Return code for TestSuite
    * TestSuite app
    * Measure and report min, max, mean, percentile latency
    * Return code
* Parser2
    * Figure out how to reintroduce implied quantifiers. Then revert unit test changes. Parser change introduced in 8bbd7455.
    * Group EntitySequenceTokens
    * Add to order
    * Remove
    * Restate
    * Start over
* Fuzzer2
    * Document usage in README.md
    * Command-line argument - save failures only
    * Create EntityGenerators from menu inspection
    * Create OptionGenerators from menu inspection
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


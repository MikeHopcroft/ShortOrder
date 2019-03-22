# TODO List

* Integrate token-flow 0.0.28
    * Publish 0.0.29. Pick up from npm instead of local.
    * Sort out debug package dependency.
    * NUMBERTOKEN vs QUANTITY
    * parser_Demo
        * "hi there give me uh a coffee with two creams" gives one cream.
        * remove the burger from an empty cart give 0 burgers
        * "fries" gives attribute fried
    * relevance_demo_english
        * Reinstate HackedStemmer.
    * parser.ts
        * Clean up imports
    * WORD and WordToken
        * Are these still used by ShortOrder?
        * Are they still used by TokenFlow?
        * Relationship to UnknownToken?


* Bugs
    * BUG: fix Spanish relevance cases.
    * BUG: hamburger extra pickles does not add pickles
    * BUG: six piece wings wings wings adds separate two wing sauce line items

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


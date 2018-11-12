# TODO List

* Tokenizer REPL
    * @debug command
* Parser REPL
    * @debug command
    * @tokenize command
    * @restart
    * Async messages from timer

* Cart operations
    * BUG: adding second cheeseburger in cart_demo adds a new line item.
    * Distinction between increasing the quantity and setting the quantity.
    * Merging two menu items when their modifications become identical
    * Sort out number of choice items to add under multiples (e.g. 2 surf n turf needs 2 drinks)
    * Scenario: customize one sandwich in surf-n-turf.
    * Scenario: wings come with choices for 2 or 4 sauces. How to fill these.
    * Scenario: 'bbq sauce' means 'bbq dipping sauce' for wings and 'bbq sauce' ingredient for Dakota Burger. Similar with ketchup packet and ketchup ingredient.
    * Scenario: 'Chicago dog no bun' - which bun do we remove? Is bun a category? 'Chicago dog no salt' - means no celerey salt.

* Prepare to receive answers to questions
    * What beverage would you like with your surf n turf?
    * Is that all?
    * Would you like onion rings with that?
    * What flavor shake?
* Categories (e.g. flavor, size, etc.)
    * Default values
    * Change one value to another. (e.g. chocolate shake make that a vanilla)
* Prepositions
    * e.g. one of them, both of them, all of them, the other
    * make the shake chocolate, the shake should be chocolate
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

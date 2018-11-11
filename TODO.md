# TODO List

* Parser functions should process and return state consisting of the cart and a list of actions.
* Actions should be defined as interfaces (vs strings) so they can be processed further (e.g. sort, select top, render into text, etc.)
* Distinction between increasing the quantity and setting the quantity.
* Unit tests for CartOps: update and format methods.
* Unit tests for Order: formatting
* BUG: adding second cheeseburger in cart_demo adds a new line item.
* Sort out pricing for options - option list price or entity price
* Merging two menu items when their modifications become identical
* Menu
  * Prices for everything
  * register tape names
* Sort out number of choice items to add under multiples (e.g. 2 surf n turf needs 2 drinks)
* Check for legal quantities
* Recording errors in action list
* More intents
    * More time
    * End order
    * Replace
    * Substitute
    * Start over
* Categories (e.g. flavor, size, etc.)
* Presumptive close
* Pluggable sales tax.
* Scenario: customize one sandwich in surf-n-turf.

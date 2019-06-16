# short-order [![Build Status](https://travis-ci.com/MikeHopcroft/ShortOrder.svg?branch=master)](https://travis-ci.com/MikeHopcroft/ShortOrder)

**short-order** is an exerimental natural language conversational agent intended for domains with a fixed vocabulary of entities and a small number of intents. Uses might include ordering food from a restaurant or organizing your song collection.

`short-order` is based on a pattern-driven tokenizer from the companion [token-flow project](https://github.com/MikeHopcroft/TokenFlow). For more information on configuring `short-order`, please see our [concepts explainer](documentation/concepts).

Here's a sample dialog involving ordering at the drive through of ficticious restaurant called `Mike's American Grill`:

~~~
% node build/samples/parser_demo.js 

14 items contributed 200 aliases.
5 items contributed 28 aliases.
16 items contributed 31 aliases.
60 items contributed 212 aliases.

-----------------------------------------

SHORT-ORDER "Welcome to Mike's American Grill. What can I get started for you?"

-----------------------------------------
CUSTOMER: "hi there give me uh a coffee with two creams":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
Subtotal                                      1.29
    Tax                                       0.12
Total                                         1.41

SHORT-ORDER: "Ok. Can I get you anything else?"

-----------------------------------------
CUSTOMER: "let's start over":

QTY ITEM                                     TOTAL
Subtotal                                          
    Tax                                           
Total                                             

SHORT-ORDER: "Welcome to Mike's American Grill. What can I get started for you?"

-----------------------------------------
CUSTOMER: "can I get a cheeseburger well done with no pickles double onion double lettuce and a coffee two cream two sugar":

QTY ITEM                                     TOTAL
  1 Cheeseburger                              1.99
      Well Done                                   
      NO Pickles                                  
      XTRA Sliced Red Onion                       
      XTRA Leaf Lettuce                           
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
Subtotal                                      3.28
    Tax                                       0.30
Total                                         3.58

SHORT-ORDER: "Got it. Is that everything?"

-----------------------------------------
CUSTOMER: "blah blah blah":

QTY ITEM                                     TOTAL
  1 Cheeseburger                              1.99
      Well Done                                   
      NO Pickles                                  
      XTRA Sliced Red Onion                       
      XTRA Leaf Lettuce                           
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
Subtotal                                      3.28
    Tax                                       0.30
Total                                         3.58

SHORT-ORDER: "I didn't understand that. What else would you like?"

-----------------------------------------
CUSTOMER: "also get me a hamburger with swiss please":

QTY ITEM                                     TOTAL
  1 Cheeseburger                              1.99
      Well Done                                   
      NO Pickles                                  
      XTRA Sliced Red Onion                       
      XTRA Leaf Lettuce                           
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
Subtotal                                      5.27
    Tax                                       0.47
Total                                         5.74

SHORT-ORDER: "Got it. What else?"

-----------------------------------------
CUSTOMER: "lose the cheeseburger and get me a couple pet chicken":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
  2 Grilled Petaluma Chicken Sandwich         7.98
Subtotal                                     11.26
    Tax                                       1.01
Total                                        12.27

SHORT-ORDER: "Got it. Anything else?"

-----------------------------------------
CUSTOMER: "just a sec":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
  2 Grilled Petaluma Chicken Sandwich         7.98
Subtotal                                     11.26
    Tax                                       1.01
Total                                        12.27

SHORT-ORDER: "Take your time."

-----------------------------------------
CUSTOMER: "i'll also take I don't know a surf n turf":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
  2 Grilled Petaluma Chicken Sandwich         7.98
  1 Surf N Turf                               7.99
Subtotal                                     19.25
    Tax                                       1.73
Total                                        20.98

SHORT-ORDER: "Ok. What beverage would you like with your Surf N Turf?"

-----------------------------------------
CUSTOMER: "make that with a small diet coke":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
  2 Grilled Petaluma Chicken Sandwich         7.98
  1 Surf N Turf                               7.99
    1 Small Diet Coke                             
Subtotal                                     19.25
    Tax                                       1.73
Total                                        20.98

SHORT-ORDER: "Ok. Is that all?"

-----------------------------------------
CUSTOMER: "that'll do it":

QTY ITEM                                     TOTAL
  1 Medium Coffee                             1.29
      ADD 2 Cream                                 
      ADD 2 Sugar                                 
  1 Hamburger                                 1.69
      ADD Swiss Cheese Slice                  0.30
  2 Grilled Petaluma Chicken Sandwich         7.98
  1 Surf N Turf                               7.99
    1 Small Diet Coke                             
Subtotal                                     19.25
    Tax                                       1.73
Total                                        20.98

SHORT-ORDER: "Thank you. Your total is $20.98. Please pull forward."
~~~

## How Short-Order Works

As an example, consider the following utterance, which would typically come from a speech-to-text system:

~~~
I would like a Dakota burger with no onions extra pickles fries and a coke
~~~

In this example, the utterance has no commas, since they were not provided by the speech-to-text process.

Using [token-flow](https://github.com/MikeHopcroft/TokenFlow), this text might be tokenized as

~~~
[ADD_TO_ORDER] [QUANTITY(1)] [DAKOTA_BURGER(pid=4)] [QUANTITY(0)]
[SLICED_RED_ONION(pid=5201)] [QUANTITY(1)] [PICKLES(pid=5200)]
[MEDIUM_FRENCH_FRIES(pid=401)] [CONJUNCTION] [QUANTITY(1)]
[MEDIUM_COKE(1001)]
~~~

After tokenization, the short-order parser groups the tokens into a tree that reflects the speaker's intent:
~~~
[ADD_TO_ORDER]
    [QUANTITY(1)] [DAKOTA_BURGER(pid=4)]            // Burger, standalone menu item.
        [QUANTITY(0)] [SLICED_RED_ONION(pid=5201)]  //   Remove onion modification
        [QUANTITY(1)] [PICKLES(pid=5200)]           //   Add pickles modification
    [QUANTITY(1)] [MEDIUM_FRENCH_FRIES(pid=401)]    // French Fries, standalone menu item
    [QUANTITY(1)] [MEDIUM_COKE(1001)]               // Coke, standalone
~~~

## Try It Out

short-order is currently in the earliest stages of development, so documentation is
sparse or nonexistant, and the code stability is uneven.

If you are interested in taking a look, you can clone the repo on GitHub or install
[short-order](https://www.npmjs.com/package/short-order) with npm.

~~~
npm install shortorder
~~~

`short-order` includes a number of working samples, based on a ficticious restaurant and an imaginary car dealership.

These samples are not included in the [short-order npm package](https://www.npmjs.com/package/short-order). To use them, you must
clone the [repo from GitHub](https://github.com/MikeHopcroft/ShortOrder).

You can find the definition files for the menu, intents, attributes, and quantifiers at
* `samples/data/restaurant-en/menu.yaml`
* `samples/data/restaurant-en/intents.yaml`
* `samples/data/restaurant-en/attributes.yaml`
* `samples/data/restaurant-en/quantifiers.yaml`

### Drive Through Conversation Sample

This example generated the conversation at the beginning of this README. If you've cloned the repo, you can build and run the sample as follows:

~~~
npm install
npm run compile
node build/samples/parser_demo.js
~~~

### Printing the menu
It is often helpful to be able to inspect the menu. The `menu_demo` sample prints out the menu.

~~~
% node build/samples/menu_demo.js 

1 Hamburger
  Ingredients: Seasame Bun, Pickles, Sliced Red Onion, Leaf Lettuce, Tomato Slice, Ketchup, Yellow Mustard
  Options: American Cheese Slice, Cheddar Cheese Slice, Swiss Cheese Slice, Monterey Jack Cheese Slice, Dijon Mustard, Tartar Sauce, Mayonnaise, Sriracha Mayonnaise, Well Done

2 Cheeseburger
  Ingredients: Seasame Bun, American Cheese Slice, Pickles, Sliced Red Onion, Leaf Lettuce, Tomato Slice, Ketchup, Yellow Mustard
  Options: Well Done

3 Big Apple Burger
  Ingredients: Seasame Bun, American Cheese Slice, Pickles, Sliced Red Onion, Leaf Lettuce, Tomato Slice, Ketchup, Yellow Mustard

4 Dakota Burger
  Ingredients: Seasame Bun, American Cheese Slice, Pickles, Sliced Red Onion, Leaf Lettuce, Tomato Slice, Ketchup, Yellow Mustard

100 Grilled Petaluma Chicken Sandwich
  Ingredients: Whole Wheat Bun, Grilled Chicken Breast, Pickles, Leaf Lettuce, Tomato Slice, Tartar Sauce

101 Fried Petaluma Chicken Sandwich
  Ingredients: Whole Wheat Bun, Fried Chicken Breast, Pickles, Leaf Lettuce, Tomato Slice, Mayonnaise

200 Down East Fish Sandwich
  Ingredients: Seasame Bun, Fried Cod Fillet, American Cheese Slice, Tartar Sauce

201 Northwest Sockeye Sandwich
  Ingredients: Ancient Grains Bun, Grilled Sockeye Fillet, Sliced Red Onion, Leaf Lettuce, Tomato Slice, Tartar Sauce

400 Small French Fries

401 Medium French Fries

402 Large French Fries

410 6 Wings

411 12 Wings

1000 Small Coke
  Ingredients: Ice

1001 Medium Coke
  Ingredients: Ice

1002 Large Coke
  Ingredients: Ice

1003 Small Diet Coke
  Ingredients: Ice

1004 Medium Diet Coke
  Ingredients: Ice

1005 Large Diet Coke
  Ingredients: Ice

1070 Small Unsweet Tea
  Ingredients: Ice

1071 Medium Unsweet Tea
  Ingredients: Ice

1072 Large Unsweet Tea
  Ingredients: Ice

1073 Small Sweet Tea
  Ingredients: Ice

1074 Medium Sweet Tea
  Ingredients: Ice

1075 Large Sweet Tea
  Ingredients: Ice

1100 Small Coffee
  Options: Sleeve, Sugar, Sweet N Low, Equal, Stevia, Cream, Half And Half

1101 Medium Coffee
  Options: Sleeve, Sugar, Sweet N Low, Equal, Stevia, Cream, Half And Half

1102 Large Coffee
  Options: Sleeve, Sugar, Sweet N Low, Equal, Stevia, Cream, Half And Half

6000 Surf N Turf
  Ingredients: Cheeseburger, Down East Fish Sandwich, Large Coke
  Choices: beverage
~~~

### Relevance Test Sample

This sample runs a suite of test utterances through the tokenization pipeline. The test utterances can be found at `samples/data/restaurant-en/tests.yaml`.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm install
npm run compile
node build/samples/relevance_demo.js
~~~

The output is the sequence of tokens extracted for each test utterance:

~~~
% node build/samples/relevance_demo.js

14 items contributed 143 aliases.
5 items contributed 22 aliases.
16 items contributed 31 aliases.
60 items contributed 210 aliases.

All tests passed.

0 general - PASSED
   input "Hamburger with extra pickles"
  output "[ENTITY:HAMBURGER,1] [QUANTITY:1] [QUANTITY:1] [ENTITY:PICKLES,5200]"
expected "[ENTITY:HAMBURGER,1] [QUANTITY:1] [QUANTITY:1] [ENTITY:PICKLES,5200]"

1 general - PASSED
   input "Uh yeah I'd like a pet chicken fries and a coke"
  output "[UNKNOWN:Uh] [INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"
expected "[UNKNOWN:Uh] [INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"

2 general - PASSED
   input "Uh yeah I'd like a pet chicken french fries and a coke"
  output "[UNKNOWN:Uh] [INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"
expected "[UNKNOWN:Uh] [INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"

3 general - PASSED
   input "Can I get a cheeseburger with swiss"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:CHEESEBURGER,2] [QUANTITY:1] [ENTITY:SWISS_CHEESE_SLICE,5102]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:CHEESEBURGER,2] [QUANTITY:1] [ENTITY:SWISS_CHEESE_SLICE,5102]"

4 general - PASSED
   input "I'll have two six piece wings"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:6_WINGS,410]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:6_WINGS,410]"

5 general - PASSED
   input "I'll have five dozen wings"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:5] [ENTITY:12_WINGS,411]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:5] [ENTITY:12_WINGS,411]"

6 general - PASSED
   input "Get me a coffee with two creams and one sugar"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [QUANTITY:1] [QUANTITY:2] [ENTITY:CREAM,1194] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:SUGAR,1190]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [QUANTITY:1] [QUANTITY:2] [ENTITY:CREAM,1194] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:SUGAR,1190]"

7 general - PASSED
   input "Large iced tea unsweet"
  output "[ENTITY:LARGE_UNSWEET_TEA,1072]"
expected "[ENTITY:LARGE_UNSWEET_TEA,1072]"

8 bugreport - PASSED
   input "can I have two hamburgers"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"

9 bugreport - PASSED
   input "Can I get a coffee I'd also like two hamburgers"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"

Suites:
  general: 8/8
  bugreport: 2/2

Priorities:
  1: 10/10

Overall: 10/10
~~~

You can run the Spanish version as follows:

~~~
npm install
npm run compile
node build/samples/relevance_demo_spanish.js
~~~

It will produce output like
~~~
% node build/samples/relevance_demo.js

14 items contributed 133 aliases.
5 items contributed 35 aliases.
16 items contributed 37 aliases.
60 items contributed 253 aliases.

Failing tests:
0 general - PASSED
   input "Hamburguesa con Pickles Extra"
  output "[ENTITY:HAMBURGER,1] [QUANTITY:1] [ENTITY:PICKLES,5200] [QUANTITY:1]"
expected "[ENTITY:HAMBURGER,1] [QUANTITY:1] [ENTITY:PICKLES,5200] [QUANTITY:1]"

1 general - PASSED
   input "Si me gustaría unas pollo grillado petaluma papas fritas y una coca"
  output "[INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"
expected "[INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:MEDIUM_FRENCH_FRIES,401] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"

2 general - PASSED
   input "Si me gustaria unas pollo grillado petaluma papas pequeñas y una coca"
  output "[INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:SMALL_FRENCH_FRIES,400] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"
expected "[INTENT:SEPERATORS] [INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GRILLED_PETALUMA_CHICKEN_SANDWICH,100] [ENTITY:SMALL_FRENCH_FRIES,400] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:MEDIUM_COKE,1001]"

3 general - PASSED
   input "Puedo pedir una hamburguesa con queso suizo"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:CHEESEBURGER,2] [ENTITY:SWISS_CHEESE_SLICE,5102]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:CHEESEBURGER,2] [ENTITY:SWISS_CHEESE_SLICE,5102]"

4 general - PASSED
   input "Quiero dos alitas de seis"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:6_WINGS,410]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:6_WINGS,410]"

5 general - FAILED
   input "Quiero cinco alitas de doce"
  output "[INTENT:ADD_TO_ORDER] [UNKNOWN:cinco] [ENTITY:12_WINGS,411]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:5] [ENTITY:12_WINGS,411]"

6 general - PASSED
   input "Dame un cafe con dos cremas y un azucar"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [QUANTITY:1] [QUANTITY:2] [ENTITY:CREAM,1194] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:SUGAR,1190]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [QUANTITY:1] [QUANTITY:2] [ENTITY:CREAM,1194] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:SUGAR,1190]"

7 general - PASSED
   input "Te sin edulcorante grande"
  output "[ENTITY:LARGE_UNSWEET_TEA,1072]"
expected "[ENTITY:LARGE_UNSWEET_TEA,1072]"

8 bugreport - PASSED
   input "Quiero dos hamburguesas"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"

9 bugreport - PASSED
   input "Puedo pedir un cafe también quiero dos hamburguesas"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [INTENT:CONJUNCTION] [INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:MEDIUM_COFFEE,1101] [INTENT:CONJUNCTION] [INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:HAMBURGER,1]"

Suites:
  general: 7/8
  bugreport: 2/2

Priorities:
  1: 9/10

Overall: 9/10
~~~


### REPL Sample

This sample provides a Read-Eval-Print-Loop that runs the tokenizer on each line entered.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm run compile
node build/samples/repl_demo.js
~~~

~~~
% node build/samples/repl_demo.js

Welcome to the ShortOrder REPL.
Type your order below.
A blank line exits.

14 items contributed 143 aliases.
5 items contributed 22 aliases.
16 items contributed 31 aliases.
60 items contributed 210 aliases.

% i'd like a dakota burger fries and a coke

INTENT: ADD_TO_ORDER: "i'd like"
QUANTITY: 1: "a"
ENTITY: DAKOTA_BURGER(4): "dakota burger"
ENTITY: MEDIUM_FRENCH_FRIES(401): "fries"
INTENT: CONJUNCTION: "and"
QUANTITY: 1: "a"
ENTITY: MEDIUM_COKE(1001): "coke"

% actually make that a pet chicken with extra pickles

INTENT: CANCEL_LAST_ITEM: "actually"
INTENT: RESTATE: "make that"
QUANTITY: 1: "a"
ENTITY: GRILLED_PETALUMA_CHICKEN_SANDWICH(100): "pet chicken"
QUANTITY: 1: "with"
QUANTITY: 1: "extra"
ENTITY: PICKLES(5200): "pickles"

%
bye
~~~

### Stemmer Confusion Matrix Sample
In some cases, the stemmer can stem words with different meanings to the same term.
One can check for these problems in their `attributes.yaml`, `menu.yaml`, `quantifiers.yaml`, `stopwords.yaml`, `units.yaml` and `intents.yaml` files by producing a stemmer confusion matrix.

~~~
node build/samples/stemmer_confusion_demo.js

Stemmer Confusion Matrix

"and": [and,And]
"small": [small,Small]
"medium": [medium,Medium]
"larg": [large,Large]
"half": [half,Half]
"hot": [hot,Hot]
"ice": [iced,Iced,Ice,ice]
"whole": [whole,Whole]
"low": [low,Low]
"dog": [Dog,dog]
"fri": [Fried,Fries]
"french": [French,french]
"onion": [Onion,Onions]
"wing": [Wings,wings,Wing]
"dozen": [dozen,Dozen]
"sweet": [Sweet,sweet]
"cream": [Cream,cream]
"pickl": [Pickles,Pickle]
"slice": [Slices,Sliced]
"salt": [Salt,Salted]
"done": [Done,done]
"that": [that,that's]
"thank": [thank,thanks]
~~~

In the example above, we see that the words `fries` and `fried` are treated as the same term, causing the phrase, `"I'll have a pet chicken fries and a coke"` to be interpreted as `"pet chicken fried"`, instead of a `"pet chicken"` and `"French fries"`.

~~~
% I'll have a pet chicken fries and a coke

INTENT: ADD_TO_ORDER: "I'll have"
QUANTITY: 1: "a"
ENTITY: FRIED_PETALUMA_CHICKEN_SANDWICH(101): "pet chicken fries"
INTENT: CONJUNCTION: "and"
QUANTITY: 1: "a"
ENTITY: MEDIUM_COKE(1001): "coke"
~~~

One can address this problem with a different stemmer or lemmatizer. One simple work-around is to wrap the default stemmer in a function that has special handling
for certain words like `fried` and `fries`:

~~~
function hackedStemmer(term: string): string {
    const lowercase = term.toLowerCase();
    if (lowercase === 'fries' || lowercase === 'fried') {
        return lowercase;
    }
    return Tokenizer.defaultStemTerm(lowercase);
}
~~~

## Conversational Agent Design Notes

Here's a very brief roadmap for the project.
* Write a the tokenizer. Code currently resides in the [token-flow](https://github.com/MikeHopcroft/TokenFlow) project.
* Implement a menu/catalog data structure with rules for the hierarchical composition of menu items,
default ingrediants, optional ingrediants, substitutions, combos, specials, etc.
* Implement a general menu item attribute system, so that one can ask for a `"small latte"`
and then say `"make it a double"`.
* Implement an intent parser for adding items, customizing items, making substitutions,
removing items, etc.
* Integrate intent parser into a conversational agent that takes the order,
while asking clarifying questions and offering to upsell.
* Implement a sample bot that uses the conversational agent.



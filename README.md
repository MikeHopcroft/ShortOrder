# short-order [![Build Status](https://travis-ci.com/MikeHopcroft/ShortOrder.svg?branch=master)](https://travis-ci.com/MikeHopcroft/ShortOrder)

**short-order** is an exerimental natural language conversational agent intended for domains with a fixed vocabulary of entities and a small number of intents. Uses might include ordering food from a restaurant or organizing your song collection.

The first stage of development is a set of tokenizers that detect entities, intents, and quantities. As an example, consider the following utterance, which would typically come from a speech-to-text system:

~~~
I would like a Dakota burger with no onions extra pickles fries and a coke
~~~

In this example, the utterance has no commas, since they were not provided by the speech-to-text process.

Using ShortOrder, this text might be tokenized as

~~~
[ADD_TO_ORDER] [QUANTITY(1)] [DAKOTA_BURGER(pid=4)] [QUANTITY(0)]
[SLICED_RED_ONION(pid=5201)] [QUANTITY(1)] [PICKLES(pid=5200)]
[MEDIUM_FRENCH_FRIES(pid=401)] [CONJUNCTION] [QUANTITY(1)]
[MEDIUM_COKE(1001)]
~~~

After tokenization, a parser might be able to group the tokens into a tree that reflects the speaker's intent:
~~~
[ADD_TO_ORDER]
    [QUANTITY(1)] [DAKOTA_BURGER(pid=4)]            // Burger, standalone menu item.
        [QUANTITY(0)] [SLICED_RED_ONION(pid=5201)]  //   Remove onion modification
        [QUANTITY(1)] [PICKLES(pid=5200)]           //   Add pickles modification
    [QUANTITY(1)] [MEDIUM_FRENCH_FRIES(pid=401)]    // French Fries, standalone menu item
    [QUANTITY(1)] [MEDIUM_COKE(1001)]               // Coke, standalone
~~~

## Try It Out

ShortOrder is currently in the earliest stages of development, so documentation is
sparse or nonexistant, and the code stability is uneven.

If you are interested in taking a look, you can clone the repo on GitHub or install
[short-order](https://www.npmjs.com/package/short-order) with npm.

~~~
npm install shortorder
~~~

As of [commit 3166f1e2](https://github.com/MikeHopcroft/ShortOrder/commit/3166f1e21cf96fed8d0fbe56aeb4f38841b62fd6), there are a number of working samples, based on a ficticious restaurant.

These samples are not included in the [short-order npm package](https://www.npmjs.com/package/short-order). To use them, you must
clone the [repo from GitHub](https://github.com/MikeHopcroft/ShortOrder).

You can find the definition files for the menu, intents, attributes, and quantifiers at
* `samples\data\menu.yaml`
* `samples\data\intents.yaml`
* `samples\data\attributes.yaml`
* `samples\data\quantifiers.yaml`

### Relevance Test Sample

This sample runs a suite of test utterances through the tokenization pipeline. The test utterances can be found at `samples\data\tests.yaml`.

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
One can check for these problems in their `menu.json`, `quantifiers.json`, and `intents.json` files by producing a stemmer confusion matrix.

~~~
node build\samples\stemmer_confusion_demo.js

14 items contributed 143 aliases.
5 items contributed 22 aliases.
16 items contributed 31 aliases.
60 items contributed 210 aliases.
"fri": [fried,fries]
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

## Tokenizer Design Notes


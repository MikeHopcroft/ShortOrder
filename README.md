# short-order [![Build Status](https://travis-ci.com/MikeHopcroft/ShortOrder.svg?branch=master)](https://travis-ci.com/MikeHopcroft/ShortOrder)

## **NOTICE:** we're in the process of a major refactoring.

Commit [e00b2205](https://github.com/MikeHopcroft/ShortOrder/commit/e00b220546a5dc06189fbc0a6e394b19b7373744) is the last version that maintains the functionality described in the original
[README.md](archive/README.md). This commit is tagged
[deprecate-original](https://github.com/MikeHopcroft/ShortOrder/releases/tag/deprecate-original).

The last NPM package version with the original algorithm is [short-order@v0.0.48](https://www.npmjs.com/package/short-order/v/0.0.48).

Much of the original code will be stored in the [archive](archive) folder until the refactor is complete and the original functionality is restored.

---

**short-order** is an exerimental natural language conversational agent intended for domains with a fixed vocabulary of entities and a small number of intents. Uses might include ordering food from a restaurant or organizing your song collection.

`short-order` is based on a pattern-driven tokenizer from the companion [token-flow project](https://github.com/MikeHopcroft/TokenFlow) and a menu library from [prix-fixe](https://github.com/MikeHopcroft/PrixFixe). For more information on configuring `short-order`, please see our [concepts explainer](documentation/concepts).

## Try It Out

`short-order` is currently in the earliest stages of development, so documentation is sparse or nonexistant, and the code stability is uneven.

If you are interested in taking a look, you can clone the repo on GitHub or install [short-order](https://www.npmjs.com/package/short-order) with npm.

## Building short-order

`short-order` is a [Node.js](https://nodejs.org/en/) project,
written in [TypeScript](https://www.typescriptlang.org/).
In order to use `short-order` you must have
[Node](https://nodejs.org/en/download/) installed on your machine.
`short-order` has been tested with Node version 10.15.3.
~~~
% git clone git@github.com:MikeHopcroft/ShortOrder.git
% npm install
% npm run compile
~~~

## Configuration
Before using `short-order`, you must tell it where to find the menu data files, using one of the following three methods:
* Set the `PRIX_FIXE_DATA` environment variable in the shell.
* Set the `PRIX_FIXE_DATA` in a `.env` file at the root of the repo.
* Using the `-d` command-line argument in tools like `confusion_matrix`, `test_maker.js`, and `test_runner.js`.

`short-order` includes a number of working samples, based on a ficticious restaurant. These files can be found in [samples/data](samples/data).

These samples are not included in the [short-order npm package](https://www.npmjs.com/package/short-order). To use them, you must
clone the [repo from GitHub](https://github.com/MikeHopcroft/ShortOrder).

## Samples (COMING SOON)
This section will describe the following sample applications:
* test_maker.js
* test_generator.js
* test_runner.js
* confusion_matrix.js
* repl.js

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



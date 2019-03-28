# ShortOrder Concepts

## Entities
`Entities` are items that can be added to the shopping `Cart`, either as top-level, stand-alone items, or as children of another items. Consider a hamburger with pickles. The hamburger is a top-level, stand-alone entity that a customer could order. The pickles are not stand-alone, but can be added as a child of the hamburger.

`Entities` are specified in a YAML file, which we will refer to as the `Catalog`.
An `Entitiy` specification consists of the following fields:
* **pid** - a unique product identifer for the entity. Must be a positive integer. Typically corresponds to a SKU.
* **aliases** - a set of patters used to configure the Tokenizer. See [`Aliases`](#aliases) section, below for more details.
* **price** - the price of the item.
* **standalone** - a boolean specifying whether the item can be ordered by itself. For example, a hamburger would likely be standalone, but the pickles would not.
Note that a standalone item can still be a child of another item (e.g. a hamburger as a child of a meal).
* **composition** - this section configures the business rules around adding items to other items.
    * **defaults** - specifies the list of items that come with the parent item by default. Includes information about min, max, and default quantity, and the price for amounts over the default.
    * **choices** - specifies a list of items to be presented as a choice. The choice must be fulfilled before the order can be considered complete. Think of a meal that comes with a hamburger, fries, and a choice of beverage.
    Choices define a class name, which is used in prompting the customer. For example, a beverage choice may define `className: drink` so that the system
    knows to prompt for a `drink` (as opposed to, say a `toy` or a `dessert`).
    * **substitutions** - specifies items that act as substitutions for default items. The scenario here is that a customer order a cheeseburger that comes with American cheese by default. The customer asks for Swiss cheese. If Swiss is a substitution for American, then `ShortOrder` will remove the American and replace it with Swiss. If Swiss is not a substitution for American, `ShortOrder` will add a slice of Swiss, in addition to the American.
    * **options** - this is a list of entities that can be added as options. As with defaults, it is possible to specify min, max, and default quantities along with pricing info.


## Attributes
`Attributes` are modifiers for generic entities which represent a class of specific entities. Consider, for example, a generic `cola` entity that is available in `small`, `medium`, and `large` sizes and in `diet` and `regular` versions. Each of the following combinations represents a different product id:
* small cola
* medium cola
* large cola
* small diet cola
* medium diet cola
* large diet cola

In `short-order`, the words `small`, `medium`, and `large` correspond to `attributes` in the `size` `dimension`.
Likewise, the words `diet` and `regular` correspond to attributes in the `sweetened` `dimension`.

Sometimes words like `diet` can just be part of the product name. Some reasons to use `generic products`, configured by `attributes` are
* scenarios where the attributes can appear in any order, and can be positioned before an after the generic entity. This happens a lot with coffee drinks like `"large decaf latte iced"` and `"large iced decaf latte"`.
* scenarios where the attributes could be co-mingled with other terms, e.g. `"I'd like a large skinny decaf iced latte"`. In this case, the terms, `large`, `decaf`, and `iced` determine the product id and while the term `skinny` just modifies the milk without changing the product id.
* scenarios where the customer wants to change an existing item in the cart, e.g. `"I'd like a large iced latte. Actually make that decaf."`, or `"Please get me two iced lattes, one decaf and the small"`.


## Modifiers

## Intents

## Quantifiers

## Units

## <a name="aliases"></a>Aliases
Aliases are used to configure the `token-flow` pattern matcher that `short-order` uses to detect entities. Each `entity`, `attribute`, `modifier`, `intent`, and `quantifier` has an associated list of aliases. `token-flow` will attempt to match input text against each of the aliases.

The `token-flow` alias generator supports a few constructs to simplify the job of writing aliases:
* optional: a comma-separated list of phrases inside square brackets is treated an a choice of zero or one phrase from the list. So, the pattern `"chicago [combo,meal]"` would match any of the following:
    * chicago
    * chicago combo
    * chicago meal
* choose exactly one: a comma-separated list of phrases inside parentheses is treated as a choice of exactly one phrase from the list. So the pattern, `"(iced,sweet) tea"` would match
    * iced tea
    * sweet tea

Note that you cannot nest either of these constructs.

The `token-flow` alias generator also allows one to specify the matching algorithm on a per-alias basis. The algorithm is selected by the `exact:`, `prefix:`, and `relaxed:` keywords at the beginning of the phrase.
* exact - only consider exact matches. The only matches for "New York City"` is
    * New York City
* prefix - only consider matches to a prefix of the pattern. Prefix matches for `"New York City"` would include
    * New
    * New York
    * New York City
* relaxed - considers matches with insertions, deletions, and transpositions. Relaxed matches for `"New York City"` might include
    * New City
    * York City
    as well as some of the other matches.

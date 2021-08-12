import {
  AID,
  AttributeInfo,
  DID,
  ICartOps,
  ICatalog,
  ItemInstance,
  IRuleChecker,
  PID,
  ICookbook,
} from 'prix-fixe';

import { Token } from 'token-flow';

import {
  attribute,
  conjunction,
  numberToken,
  option,
  optionRecipe,
  quantity,
  unit,
} from '../lexer';

import { Services } from './context';
import { GapToken, Segment } from './interfaces';

import {
  choose,
  createMatcher,
  Grammar,
  optional,
  processGrammar,
} from './pattern_matcher';

import { Sequence } from './sequence';

// Equality predicate for tokens.
function equality(a: Token, b: Token): boolean {
  return a.type === b.type;
}

///////////////////////////////////////////////////////////////////////////////
//
// EntityBuilderBase
//
///////////////////////////////////////////////////////////////////////////////
class EntityBuilderBase {
  protected readonly cartOps: ICartOps;
  protected readonly catalog: ICatalog;
  protected readonly cookbook: ICookbook;
  private readonly info: AttributeInfo;
  protected readonly rules: IRuleChecker;

  protected readonly generateRegexOptions: boolean;

  // Only used to see whether we have two attributes on a dimension.
  // Could use a Set<DID> instead.
  private readonly didToAID = new Map<DID, AID>(); // REQUIRED

  protected tokensUsed = 0;

  protected quantity = 1; // REQUIRED
  protected readonly pid: PID;
  protected readonly aids: AID[] = []; // REQUIRED
  protected readonly options: ItemInstance[] = []; // REQUIRED
  protected readonly optionTokenCounts: number[] = []; // REQUIRED

  constructor(services: Services, pid: PID, generateRegexOptions: boolean) {
    this.cartOps = services.cartOps;
    this.catalog = services.catalog;
    this.cookbook = services.cookbook;
    this.info = services.attributes;
    this.rules = services.rules;

    this.generateRegexOptions = generateRegexOptions;

    this.pid = pid;
    this.tokensUsed += 1;
  }

  getScore(): number {
    return this.tokensUsed;
  }

  // Process tokens that lie to the left of the entity.
  // This sequence may start with a quantifier. The quantifier may apply to
  // an option, as in "5 pump vanilla latte", in which case the the number of
  // items (lattes) defaults to 1. The quantifier may instead apply to the
  // item, as in "5 vanilla lattes". After the first position, quantifiers
  // only apply to options as in "3 5 pump vanilla latte with 2 pumps of
  // chocolate".
  protected processLeft(input: Sequence<Token>): void {
    // TODO: Pull match, createMatcher, matcher definitions at least into constructor.
    // TODO: Equality should go somewhere else as well.
    const match = createMatcher<Token, boolean | undefined>(equality);
    // TODO: skip star(conjunction)
    match(conjunction).skip(input);
    if (!match(numberToken, unit, attribute).test(input)) {
      match(choose(numberToken, quantity)).bind(([n]) => {
        this.quantity = n.value;
        return true;
      })(input);
    }
    this.processRemaining(input);
    this.tokensUsed += input.itemsUsed();
  }

  // Process tokens that lie to the right of the entity. This sequence is
  // considered to be made up of item attributes, and fully specified
  // options.
  protected processRight(input: Sequence<Token>): void {
    this.processRemaining(input);
    this.tokensUsed += input.itemsUsed();
  }

  private processRemaining(input: Sequence<Token>): void {
    const match = createMatcher<Token, boolean | undefined>(equality);

    const grammar: Grammar<boolean | undefined> = [
      match(conjunction).bind(() => {
        return true;
      }),

      ///////////////////////////////////////////////////////////////////////////
      //
      // Attributes
      //
      ///////////////////////////////////////////////////////////////////////////
      match(attribute).bind(([a]) => {
        const tensor = this.info.getTensorForEntity(this.pid);
        const coordinates = this.info.getAttributeCoordinates(a.id);
        if (AttributeInfo.hasDimension(tensor, coordinates.dimension.did)) {
          // Ensure that we hacven't already seen an attribute on this dimension.
          if (!this.didToAID.has(coordinates.dimension.did)) {
            this.didToAID.set(coordinates.dimension.did, a.id);
            this.aids.push(a.id);
            return true;
          }
        }

        // Skip over this attribute since it cannot be consumed.
        return undefined;
      }),

      ///////////////////////////////////////////////////////////////////////////
      //
      // OptionRecipe
      //
      ///////////////////////////////////////////////////////////////////////////

      match(optionRecipe).bind(([o], tokenCount) => {
        // TODO: pass in parent key - currently second argument is ignored.
        const recipe = this.cookbook.findOptionRecipe(o.rid, 'TODO');
        const items = this.cartOps.createItemsFromOptionRecipe(recipe);
        this.options.push(...items);
        this.optionTokenCounts.push(tokenCount);
        return true;
      }),

      ///////////////////////////////////////////////////////////////////////////
      //
      // Options
      //
      ///////////////////////////////////////////////////////////////////////////

      // TODO: [attribute, option] must come before [attribute]
      match(attribute, option).bind(([a, o], tokenCount) => {
        // Check whether attribute configures option.
        const tensor = this.info.getTensorForEntity(o.id);
        const coordinates = this.info.getAttributeCoordinates(a.id);
        if (AttributeInfo.hasDimension(tensor, coordinates.dimension.did)) {
          const item = this.cartOps.createItem(
            1,
            o.id,
            [a.id].values(),
            [].values(),
            this.generateRegexOptions
          );
          this.options.push(item);
          this.optionTokenCounts.push(tokenCount);
          return true;
        } else {
          // Fall back to outer loop to try processAttribute().
          // Don't take or discard tokens.
          return undefined;
        }
      }),

      match(optional(numberToken), optional(unit), option).bind(
        ([q, , o], tokenCount) => {
          const item = this.cartOps.createItem(
            // NEED to clamp value to legal ranges or fail if out of range
            q ? q[0].value : 1,
            o.id,
            [].values(),
            [].values(),
            this.generateRegexOptions
          );
          this.options.push(item);
          this.optionTokenCounts.push(tokenCount);
          return true;
        }
      ),
    ];

    while (!input.atEOS()) {
      const success = processGrammar(grammar, input);
      if (success === undefined) {
        // We were unable to consume the next token.
        // Discard it and move forward.
        input.discard();
      }
    }
  }

  filterIllegalOptions(parent: ItemInstance): ItemInstance[] {
    // TODO: filter out illegal options here.
    const legalOptions: ItemInstance[] = [];
    for (const [index, option] of this.options.entries()) {
      if (
        this.rules.isValidChild(parent.key, option.key) &&
        this.catalog.hasKey(option.key)
      ) {
        legalOptions.push(option);
      } else {
        // This option cannot legally configure the item.
        // Exclude it and adjust the used token count accordingly.
        this.tokensUsed -= this.optionTokenCounts[index];
      }
    }

    // Use key to filter out options that violate mutual exclusivity.
    const f = this.rules.getIncrementalMutualExclusionPredicate(parent.key);
    const filteredOptions: ItemInstance[] = [];
    for (const [index, option] of legalOptions.entries()) {
      if (f(option.key)) {
        filteredOptions.push(option);
      } else {
        // This option violated mutual exclusivity with the previous
        // options. Exclude it and adjust the used token count
        // accordingly.
        // TODO: BUGBUG: optionTokenCounts is not filtered, so
        // we're potentially using the wrong count here.
        this.tokensUsed -= this.optionTokenCounts[index];
      }
    }

    return filteredOptions;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// EntityBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class EntityBuilder extends EntityBuilderBase {
  private readonly item: ItemInstance;

  constructor(services: Services, segment: Segment) {
    super(services, segment.entity, false);

    // this.processLeft(new TokenSequence<GapToken>(segment.left), false);
    // This change enables scenarios that don't start with a quantity.
    this.processLeft(new Sequence<GapToken>(segment.left));
    this.processRight(new Sequence<GapToken>(segment.right));

    // Initially, create item without options, in order to get key.
    const item = this.cartOps.createItem(
      this.quantity,
      this.pid,
      this.aids.values(),
      [].values(),
      false // Don't generate regex Key
    );

    // Construct item with filtered options.
    const filteredOptions = this.filterIllegalOptions(item);
    this.item = { ...item, children: filteredOptions };
  }

  getItem(): ItemInstance {
    return this.item;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// TargetBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class TargetBuilder extends EntityBuilderBase {
  private readonly item: ItemInstance;

  constructor(
    services: Services,
    left: GapToken[],
    pid: PID,
    right: GapToken[]
  ) {
    super(services, pid, false);

    this.processRight(new Sequence<GapToken>(left));
    this.processRight(new Sequence<GapToken>(right));

    // Initially, create item without options, in order to get key.
    const item = this.cartOps.createItem(
      this.quantity,
      this.pid,
      this.aids.values(),
      [].values(),
      true // Generate regex Key
    );

    // We don't have a Key (we only have a regex) so we can't use the
    // rules checker to filter out options.
    // Construct item with unfiltered options.
    this.item = { ...item, children: this.options };
  }

  getItem(): ItemInstance {
    return this.item;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// OptionTargetBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class OptionTargetBuilder extends EntityBuilderBase {
  constructor(services: Services, tokens: GapToken[]) {
    const dummyPid: PID = 0;
    super(services, dummyPid, true);

    this.processRight(new Sequence<GapToken>(tokens));
  }

  getOption(): ItemInstance | undefined {
    if (this.options.length > 0) {
      return this.options[0];
    } else {
      return undefined;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// ModificationBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class ModificationBuilder extends EntityBuilderBase {
  private readonly item: ItemInstance;

  constructor(
    services: Services,
    original: ItemInstance,
    modifications: GapToken[],
    combineQuantities: boolean
  ) {
    const pid: PID = AttributeInfo.pidFromKey(original.key);
    super(services, pid, false);

    this.processRight(new Sequence<GapToken>(modifications));

    // Initially, create item without options, in order to get key.
    let modified = this.cartOps.changeItemAttributes(
      { ...original, children: [] },
      this.aids.values()
    );

    // Filter the new options for legality and mutual exclusivity amongst
    // themselves.
    const filteredOptions = this.filterIllegalOptions(modified);

    // Copy over the options from the original item before adding options
    // from the replacement item. This ensures that a replacement option
    // will supercede an original option.
    for (const option of original.children) {
      if (
        this.rules.isValidChild(modified.key, option.key) // &&
      ) {
        modified = this.cartOps.addToItem(modified, option);
      }
    }

    // Add the replacement items, with replacement enabled for items in the
    // same mutual exclusion set.
    for (const option of filteredOptions) {
      if (this.rules.isValidChild(modified.key, option.key)) {
        modified = this.cartOps.addToItemWithReplacement(
          modified,
          option,
          combineQuantities
        );
      }
    }
    this.item = modified;

    // const item = this.cartOps.changeItemAttributes(
    //     original,
    //     this.aids.values()
    // );

    // // Construct item with filtered options.
    // const filteredOptions = this.filterIllegalOptions(item);
    // this.item = {...item, children: filteredOptions};
  }

  getItem(): ItemInstance {
    return this.item;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// ReplacementBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class ReplacementBuilder extends EntityBuilderBase {
  private readonly item: ItemInstance;

  constructor(services: Services, original: ItemInstance, segment: Segment) {
    super(services, segment.entity, false);

    // TODO: copy AIDs from original.
    // Need some way to take the last AID on a dimension.
    // Perhaps make an AID set accumulator with different
    // semantics at construction time?
    // Perhaps ICartOps.createItem() can have a flag
    // that indicates whether first or last AID on dimension
    // wins.
    //
    // 119 - FAILED
    //   Comment: cappuccino should be tall like latte
    //   Suites: modify regression
    //   Utterance 0: "i added a tall latte"
    //     "0/1/tall caffe latte/407:0:1" === "0/1/tall caffe latte/407:0:1" - OK
    //   Utterance 1: "i made the latte a cappuccino"
    //     "0/1/tall cappuccino/409:0:1" !== "0/1/grande cappuccino/409:0:2" - <=== ERROR

    // Process the tokens to add the new item's configuration.
    this.processLeft(new Sequence<GapToken>(segment.left));
    this.processRight(new Sequence<GapToken>(segment.right));

    // Initially, create item without options, in order to get key.
    let replacement = this.cartOps.createItem(
      this.quantity,
      this.pid,
      this.aids.values(),
      [].values(),
      false // Don't generate regex Key
    );

    // Filter the new options for legality and mutual exclusivity amongst
    // themselves.
    const filteredOptions = this.filterIllegalOptions(replacement);

    // Copy over the options from the original item before adding options
    // from the replacement item. This ensures that a replacement option
    // will supercede an original option.
    for (const option of original.children) {
      if (this.rules.isValidChild(replacement.key, option.key)) {
        replacement = this.cartOps.addToItem(replacement, option);
      }
    }

    // Add the replacement items, with replacement enabled for items in the
    // same mutual exclusion set.
    for (const option of filteredOptions) {
      if (this.rules.isValidChild(replacement.key, option.key)) {
        replacement = this.cartOps.addToItemWithReplacement(
          replacement,
          option,
          false
        );
      }
    }
    this.item = replacement;
  }

  getItem(): ItemInstance {
    return this.item;
  }
}

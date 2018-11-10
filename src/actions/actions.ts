// DESIGN INTENT: data driven rendering of responses to facilitate
// multiple languages (e.g. English, Spanish, etc.)

// Special processing
//   CONFUSED before DONE invalidates DONE
//   CHOICE after DONE invalidates DONE
//   Successful additions after DONE invalidates DONE?
//   Probably always want to run ACKNOWLEDGE, followed by another.
//   Probably always want to run at least one CHOICE.

// Pattern driven rendering.
// Select random pattern from set.

// Perhaps run token-flow on pattern of Actions.

export interface Action {
    type: Symbol;
}

// Acknowledge user response to question.
// "OK", "Got it."
export const ACKNOWLEDGE: unique symbol = Symbol('ACKNOWLEDGE');
export type ACKNOWLEDGE = typeof ACKNOWLEDGE;

// Need to make choice selection. Added after parser runs.
// "What kind of drink would you like with the surf n turf?"
export const CHOICE: unique symbol = Symbol('CHOICE');
export type CHOICE = typeof CHOICE;

// Presumptive close
// "Is that with a large coke?"
export const CLOSE: unique symbol = Symbol('CLOSE');
export type CLOSE = typeof CLOSE;

// Order complete. Added after parser runs? Or after each cart update?
// "Can I get you anything else?"
export const COMPLETE: unique symbol = Symbol('COMPLETE');
export type COMPLETE = typeof COMPLETE;

// Errors processing order. May not have added everything correctly.
// "Not sure I got all that. Is there anything else I can get you?"
export const CONFUSED: unique symbol = Symbol('CONFUSED');
export type CONFUSED = typeof CONFUSED;

// User has completed order.
// "Thank you. Your total is $XX.YY. Please pull forward."
export const DONE: unique symbol = Symbol('DONE');
export type DONE = typeof DONE;

// Times up (after waiting, after getting a complete order w/o DONE).
// May need a TICK intent which we inject from a timer.
// "Is there anything else I can get you?"
export const PING: unique symbol = Symbol('PING');
export type PING = typeof PING;

// Read back (order contents)
// "You ordered a cheeseburger with extra pickles and a small coke."
export const READBACK: unique symbol = Symbol('READBACK');
export type READBACK = typeof READBACK;

// Refused (could not carry out - perhaps invalid quantity)
// "You can only have three slices of cheese on a hamburger."
export const REFUSED: unique symbol = Symbol('REFUSED');
export type REFUSED = typeof REFUSED;

// Upsell suggestion.
// "Would you like onions rings with that?"
export const UPSELL: unique symbol = Symbol('UPSELL');
export type UPSELL = typeof UPSELL;

// Need more time
// "Take you time."
export const WAIT: unique symbol = Symbol('WAIT');
export type WAIT = typeof WAIT;

// Welcome at start of order
// "Welcome to Mike's American Grill. What can I get started for you?"
export const WELCOME: unique symbol = Symbol('WELCOME');
export type WELCOME = typeof WELCOME;


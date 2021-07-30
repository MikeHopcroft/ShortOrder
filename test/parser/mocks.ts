///////////////////////////////////////////////////////////////////////////////
//
// Mocking framework code. Read usage examples, below before reading framework.
//
// Functionality:
//   1. Records parameters and return values and exception information for each
//   invocation.
//   2. Supplies a default implementation that throws.
//   3. Allows user to patch in their own mock function.
//
// Potential future functionality:
//   4. User-supplied return-value lists.
//   5. User-supplied param => return-value map.
//
///////////////////////////////////////////////////////////////////////////////

// ///////////////////////////////////////////////////////////////////////////////
// //
// // Usage example 1
// //
// ///////////////////////////////////////////////////////////////////////////////

// // Here is a function we'd like to mock. To build the mock, we need access to
// // the function declaration so the framework can infer  the parameter and
// // and result types.
// function realFunction(a: number, b: number, op: string): number {
//   if (op === '+') {
//     return a + b;
//   } else if (op === '-') {
//     return a - b;
//   } else if (op === '*') {
//     return a * b;
//   } else if (op === '/') {
//     return a / b;
//   } else {
//     const message = `Unknown operator "${op}".`;
//     throw new TypeError(message);
//   }
// }

// // The first step is to construct a mock using createMock(), which uses takes
// // a function as a parameter, in order to define the parameter and return types.
// const mock = createMock(realFunction);

// // Alternatively, one can specify the parameter and return types as template
// // parameters instead of inferring them from the function parameter.
// const mock2 = createMock<[number, number, string], number>();

// // This default mock will throw if invoked.
// try {
//   console.log(mock(5, 0, '/'));
// } catch (e) {
//   console.log(e.message);
// }

// // We can supply a function to call when the mock is invoked.
// mock.action((a: number, b: number, op: string) => {
//   console.log(`action(${a}, ${b}, ${op}) returns 123`);
//   return 123;
// });

// console.log(mock(5, 0, '/'))

// // After making calls to mock(), we can get back a log of all of the invocation
// // details.
// console.log(mock.log());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Mocked<PARAMS extends any[], RESULT> = (
  ...params: PARAMS
) => RESULT;

// DESIGN NOTE 1: I would prefer to implement Behavior as a type union of
// a SuccessBehavior and a ThrowBehavior, but I couldn't get it to work with
// the type guards.
//
// DESIGN NOTE 2: Behavior.result should probably have type `string | Error`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Behavior<PARAMS extends any[], RESULT> {
  params: PARAMS;
  message?: string;
  result?: RESULT;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMock<PARAMS extends any[], RESULT>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prototypeFunction: Mocked<PARAMS, RESULT> | undefined = undefined
) {
  const log: Array<Behavior<PARAMS, RESULT>> = [];
  let action: Mocked<PARAMS, RESULT> | undefined = prototypeFunction;
  const f = (...params: PARAMS): RESULT => {
    if (action) {
      try {
        const result = action(...params);
        log.push({ params, result });
        return result;
      } catch (e) {
        log.push({ params, message: e.message });
        throw e;
      }
    } else {
      const message = 'No mock defined.';
      log.push({ params, message: message });
      throw new TypeError(message);
    }
  };

  f.log = () => {
    return log;
  };

  f.action = (fun: Mocked<PARAMS, RESULT>) => {
    action = fun;
  };

  return f;
}

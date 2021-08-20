import { Continuation, State, success } from './parser/result';

export type CombinatorContents<T extends Combinator> = T extends Combinator<
  infer U
>
  ? U
  : never;

export type CombinatorTupleContents<T> = {
  [K in keyof T]: T[K] extends Combinator<infer U> ? U : T[K];
};

export type Push = <T>(
  combinator: Combinator<T>,
  state: State,
  continuation: Continuation<T>
) => void;

export abstract class Combinator<T = any> {
  public abstract children(): ReadonlyArray<Combinator>;
  public abstract parse(state: State, push: Push, cont: Continuation<T>): void;

  public map<U>(f: (value: T) => U): Combinator<U> {
    return new SimpleCombinator(
      () => [this],
      (state, push, cont) => {
        this.parse(state, push, (result) => {
          if (result.success) {
            cont(success(f(result.value), result.state));
          } else {
            cont(result);
          }
        });
      }
    );
  }
}

export class SimpleCombinator<T> extends Combinator<T> {
  public constructor(
    public readonly children: () => ReadonlyArray<Combinator>,
    public readonly parse: Combinator<T>['parse']
  ) {
    super();
  }
}

export function empty<T>(value: T): Combinator<T> {
  return new SimpleCombinator(
    () => [],
    (state, push, cont) => {
      cont(success(value, state));
    }
  );
}

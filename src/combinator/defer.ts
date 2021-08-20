import { Combinator, Push } from '../combinator';
import { Continuation, State } from '../parser/result';

export const { defer } = class DeferredCombinator<T> extends Combinator<T> {
  private inner: Combinator<T> | undefined;

  private constructor(
    private readonly reify: (self: Combinator<T>) => Combinator<T>
  ) {
    super();
  }

  public children(): ReadonlyArray<Combinator> {
    return [(this.inner ??= this.reify(this))];
  }

  public parse(state: State, push: Push, cont: Continuation<T>): void {
    return (this.inner ??= this.reify(this)).parse(state, push, cont);
  }

  public static defer<T>(
    reify: (self: Combinator<T>) => Combinator<T>
  ): Combinator<T> {
    return new DeferredCombinator(reify);
  }
};

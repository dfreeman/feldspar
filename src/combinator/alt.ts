import { Combinator, CombinatorContents, Push } from '../combinator';
import { Continuation, ParseState } from '../parser/result';

export const { alt } = class AltCombinator<T> extends Combinator<T> {
  private constructor(private readonly combinators: Array<Combinator<T>>) {
    super();
  }

  public children(): ReadonlyArray<Combinator<T>> {
    return this.combinators;
  }

  public parse(state: ParseState, push: Push, cont: Continuation<T>): void {
    for (let combinator of this.combinators) {
      push(combinator, state, cont);
    }
  }

  public static alt<T extends Array<Combinator>>(
    ...combinators: T
  ): Combinator<CombinatorContents<T[number]>> {
    return new AltCombinator(combinators);
  }
};

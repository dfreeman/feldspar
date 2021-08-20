import { Combinator, CombinatorTupleContents, Push } from '../combinator';
import { Continuation, ParseState, success } from '../parser/result';

export const { seq } = class SeqCombinator<
  T extends Array<Combinator>
> extends Combinator<CombinatorTupleContents<T>> {
  private constructor(private readonly combinators: T) {
    super();
  }

  public children(): ReadonlyArray<Combinator> {
    return this.combinators;
  }

  public parse(
    state: ParseState,
    push: Push,
    cont: Continuation<CombinatorTupleContents<T>>,
    combinator = 0,
    values: Array<unknown> = []
  ): void {
    if (combinator === this.combinators.length) {
      cont(success(values as CombinatorTupleContents<T>, state));
    } else {
      push(this.combinators[combinator], state, (result) => {
        if (!result.success) {
          cont(result);
        } else {
          this.parse(result.state, push, cont, combinator + 1, [
            ...values,
            result.value,
          ]);
        }
      });
    }
  }

  public static seq<T extends Array<Combinator>>(
    ...combinators: T
  ): Combinator<CombinatorTupleContents<T>> {
    return new SeqCombinator(combinators);
  }
};

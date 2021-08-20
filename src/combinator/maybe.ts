import { Combinator, Push } from '../combinator';
import { Continuation, ParseState, success } from '../parser/result';

export const { maybe } = class MaybeCombinator<T> extends Combinator<T | null> {
  private constructor(private readonly combinator: Combinator<T>) {
    super();
  }

  public children(): Array<Combinator> {
    return [this.combinator];
  }

  public parse(
    state: ParseState,
    push: Push,
    cont: Continuation<T | null>
  ): void {
    push(this.combinator, state, (result) => {
      if (result.success) {
        cont(result);
      } else {
        cont(success(null, state));
      }
    });
  }

  public static maybe<T>(combinator: Combinator<T>): Combinator<T | null> {
    return new MaybeCombinator(combinator);
  }
};

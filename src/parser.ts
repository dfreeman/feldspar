import { Combinator, Push } from './combinator';
import { Continuation, Result } from './parser/result';
import { Token, TokenDefinition } from './parser/token';
import { discoverTokenDefinitions, tokenize } from './parser/tokenize';

type TrampolineEntry = {
  pastResults: Set<Result<any>>;
  continuations: Set<Continuation<any>>;
};

export class Parser<T = unknown> {
  private storage = new Map<Combinator, Array<TrampolineEntry>>();
  private stack: Array<{ combinator: Combinator<unknown>; index: number }> = [];
  private tokenDefinitions: ReadonlyArray<TokenDefinition>;

  public constructor(
    private readonly entry: Combinator<T>,
    extraTokens?: Array<TokenDefinition>
  ) {
    this.tokenDefinitions = discoverTokenDefinitions(entry, extraTokens);
  }

  public parse(input: string): T | null {
    return this.parseAll(input).next().value;
  }

  public *parseAll(input: string): Generator<T, null, undefined> {
    this.stack = [];
    this.storage = new Map();

    let values: Array<T> = [];
    let tokens = tokenize(input, this.tokenDefinitions);
    let state = { tokens, index: 0 };

    this.push(this.entry, state, (result) => {
      if (result.success && result.state.index === tokens.length) {
        values.push(result.value);
      }
    });

    while (this.hasNext()) {
      this.step(tokens);
      yield* values;
      values = [];
    }

    return null;
  }

  private readonly push: Push = (combinator, { index }, continuation) => {
    let { continuations, pastResults } = this.findEntry(combinator, index);

    // If this is the first time this parser has been used at this location,
    // enqueue it to be processed.
    if (!continuations.size) {
      this.stack.push({ combinator, index });
    }

    if (!continuations.has(continuation)) {
      for (let pastResult of pastResults) {
        continuation(pastResult);
      }

      continuations.add(continuation);
    }
  };

  private hasNext(): boolean {
    return Boolean(this.stack.length);
  }

  private step(tokens: ReadonlyArray<Token>): void {
    let next = this.stack.pop();
    if (!next) return;

    let { combinator, index } = next;
    let { pastResults, continuations } = this.findEntry(combinator, index);

    combinator.parse({ tokens, index }, this.push, (result) => {
      if (pastResults.has(result)) return;

      pastResults.add(result);
      for (let cont of continuations) {
        cont(result);
      }
    });
  }

  private findEntry(combinator: Combinator, index: number): TrampolineEntry {
    let storageForCombinator = this.storage.get(combinator);
    if (!storageForCombinator) {
      storageForCombinator = [];
      this.storage.set(combinator, storageForCombinator);
    }

    let entry = storageForCombinator[index];
    if (!entry) {
      entry = { pastResults: new Set(), continuations: new Set() };
      storageForCombinator[index] = entry;
    }

    return entry;
  }
}

import { Combinator, Push } from './combinator';
import { ParseError } from './parser/errors';
import { Continuation, Result } from './parser/result';
import { discoverTokenDefinitions, EOF, tokenize } from './parser/tokenize';
import {
  Token,
  TokenDefinition,
  TokenizeResult,
  TokenizerState,
} from './parser/token';

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

  public tokenize(
    input: string,
    state: Array<TokenizerState> = []
  ): TokenizeResult {
    return tokenize(input, this.tokenDefinitions, state);
  }

  public parse(input: string): T | null {
    return this.parseAll(input).next().value;
  }

  public *parseAll(source: string): Generator<T, null, undefined> {
    this.stack = [];
    this.storage = new Map();

    let values: Array<T> = [];
    let { tokens } = this.tokenize(source);
    let state = { tokens, source, index: 0 };
    let errors = { index: 0, expected: new Set<TokenDefinition>() };
    let hasSucceeded = false;

    this.push(this.entry, state, (result) => {
      if (result.success && tokens[result.state.index]?.kind === EOF) {
        values.push(result.value);
        hasSucceeded = true;
      } else if (!result.success && !hasSucceeded) {
        if (result.state.index === errors.index) {
          errors.expected.add(result.expected);
        } else if (result.state.index > errors.index) {
          errors = {
            index: result.state.index,
            expected: new Set([result.expected]),
          };
        }
      }
    });

    while (this.hasNext()) {
      this.step(tokens, source);
      yield* values;
      values = [];
    }

    if (errors.expected.size && !hasSucceeded) {
      throw new ParseError(errors.expected, tokens[errors.index]);
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

  private step(tokens: ReadonlyArray<Token>, source: string): void {
    let next = this.stack.pop();
    if (!next) return;

    let { combinator, index } = next;
    let { pastResults, continuations } = this.findEntry(combinator, index);

    combinator.parse({ tokens, index, source }, this.push, (result) => {
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

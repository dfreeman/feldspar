import { Continuation, failure, ParseState, success } from './result';
import { Combinator, Push } from '../combinator';

export type Matcher = (input: string, offset: number) => Token | undefined;
export type TokenConfig = {
  kind?: string;
  silent?: boolean;
  priority?: number;
  requiredState?: TokenizerState;
  pushState?: TokenizerState;
  popState?: TokenizerState;
};

export interface Token {
  readonly kind: string;
  readonly offset: number;
  readonly content: string;
}

export class TokenizerState {
  public constructor(
    public readonly name: string,
    public readonly exclusive: boolean
  ) {}
}

export function state(
  name: string,
  { exclusive = false } = {}
): TokenizerState {
  return new TokenizerState(name, exclusive);
}

export function token(
  pattern: RegExp | string,
  config?: TokenConfig
): TokenDefinition {
  return new TokenDefinition(pattern, config);
}

export class TokenDefinition extends Combinator<Token> {
  public readonly kind: string;
  public readonly silent: boolean;
  public readonly priority: number;
  public readonly pushState: TokenizerState | undefined;
  public readonly popState: TokenizerState | undefined;
  public readonly requiredState: TokenizerState | undefined;
  public readonly match: (input: string, offset: number) => Token | undefined;

  public constructor(pattern: string | RegExp, config?: TokenConfig) {
    super();

    this.kind = config?.kind ?? String(pattern);
    this.silent = Boolean(config?.silent);
    this.priority = config?.priority ?? 0xff;
    this.pushState = config?.pushState;
    this.popState = config?.popState;
    this.requiredState = config?.requiredState;
    this.match =
      typeof pattern === 'string'
        ? this.stringMatcher(this.kind, pattern)
        : this.regexMatcher(this.kind, pattern);
  }

  public children(): Array<Combinator<unknown>> {
    return [];
  }

  public parse(state: ParseState, push: Push, cont: Continuation<Token>): void {
    let { tokens, index } = state;
    let token = tokens[index];
    if (token?.kind === this.kind) {
      cont(success(token, { tokens, index: index + 1 }));
    } else {
      cont(failure(this, state));
    }
  }

  private regexMatcher(kind: string, pattern: RegExp): Matcher {
    let anchored = new RegExp(`^(?:${pattern.source})`, pattern.flags);
    return (input, offset) => {
      let match = anchored.exec(input);
      if (match) {
        return { kind, offset, content: match[0] };
      }
    };
  }

  private stringMatcher(kind: string, pattern: string): Matcher {
    return (input, offset) => {
      if (input.startsWith(pattern)) {
        return { kind, offset, content: pattern };
      }
    };
  }
}

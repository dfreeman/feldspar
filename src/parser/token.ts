import { Continuation, failure, State, success } from './result';
import { Combinator, Push } from '../combinator';

export type Matcher = (input: string, offset: number) => Token | undefined;
export type TokenConfig =
  | string
  | RegExp
  | {
      pattern: string | RegExp;
      kind?: string;
      silent?: boolean;
      priority?: number;
    };

export interface Token {
  readonly kind: string;
  readonly offset: number;
  readonly content: string;
}

export class TokenDefinition extends Combinator<Token> {
  public readonly kind: string;
  public readonly silent: boolean;
  public readonly priority: number;
  public readonly match: (input: string, offset: number) => Token | undefined;

  public constructor(input: TokenConfig) {
    super();

    let config =
      typeof input === 'object' && 'pattern' in input
        ? input
        : { pattern: input };

    this.kind = config.kind ?? String(config.pattern);
    this.silent = Boolean(config.silent);
    this.priority = config.priority ?? Infinity;
    this.match =
      typeof config.pattern === 'string'
        ? this.stringMatcher(this.kind, config.pattern)
        : this.regexMatcher(this.kind, config.pattern);
  }

  public children(): Array<Combinator<unknown>> {
    return [];
  }

  public parse(state: State, push: Push, cont: Continuation<Token>): void {
    let { tokens, index } = state;
    let token = tokens[index];
    if (token?.kind === this.kind) {
      cont(success(token, { tokens, index: index + 1 }));
    } else {
      cont(failure());
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

export function token(config: TokenConfig): TokenDefinition {
  return new TokenDefinition(config);
}

import { Token, TokenDefinition } from './token';

export class TokenizerError extends Error {
  public constructor(public readonly offset: number) {
    super(`Unrecognized input at offset ${offset}`);
  }
}

export class NoResultError extends Error {
  public constructor() {
    super('Parse terminated without ever emitting a result or an error');
  }
}

export class ParseError extends Error {
  public readonly expected: Set<TokenDefinition>;
  public readonly found: Token;
  public readonly offset: number;
  public readonly length: number;

  public constructor(expected: Set<TokenDefinition>, found: Token) {
    let expectedList = [...expected].map((def) => def.kind).join(', ');
    super(
      `Parse error at offset ${found.offset}: saw ${found.kind} but expected to find one of: ${expectedList}`
    );

    this.expected = expected;
    this.found = found;
    this.offset = found.offset;
    this.length = found.content.length;
  }
}

import { Combinator } from '../combinator';
import { Token, TokenDefinition } from './token';

export function tokenize(
  input: string,
  tokenDefs: ReadonlyArray<TokenDefinition>
): Array<Token> {
  let tokens: Array<Token> = [];
  let offset = 0;
  advance: while (offset < input.length) {
    let current = input.slice(offset);
    for (let def of tokenDefs) {
      let token = def.match(current, offset);
      if (token) {
        offset += token.content.length;
        if (!def.silent) {
          tokens.push(token);
        } else if (!token.content.length) {
          throw new Error(
            `Silent token ${token.kind} matched a zero-length string; tokenization would never complete.`
          );
        }
        continue advance;
      }
    }
    throw new Error('Unrecognized token at offset ' + offset);
  }
  return tokens;
}

export function discoverTokenDefinitions(
  combinator: Combinator<unknown>,
  extraTokens: Array<TokenDefinition> = []
): Array<TokenDefinition> {
  let seen = new Set<Combinator<unknown>>();
  let tokenDefinitions = new Set(extraTokens);
  let queue = [combinator];
  let current: Combinator<unknown> | undefined;

  while ((current = queue.shift())) {
    seen.add(current);

    if (current instanceof TokenDefinition) {
      tokenDefinitions.add(current);
    } else {
      for (let child of current.children()) {
        if (!seen.has(child)) {
          queue.push(child);
        }
      }
    }
  }

  return [...tokenDefinitions].sort((a, b) => {
    return a.priority > b.priority ? 1 : a.priority < b.priority ? -1 : 0;
  });
}

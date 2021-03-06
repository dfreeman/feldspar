import { Combinator } from '../combinator';
import { TokenizerError } from './errors';
import {
  Token,
  TokenDefinition,
  TokenizeResult,
  TokenizerState,
} from './token';

export const EOF = '<EOF>';

export function tokenize(
  input: string,
  tokenDefs: ReadonlyArray<TokenDefinition>,
  state: Array<TokenizerState> = []
): TokenizeResult {
  let stateStack = state.slice();
  let tokens: Array<Token> = [];
  let offset = 0;
  advance: while (offset < input.length) {
    let current = input.slice(offset);
    let state = stateStack[stateStack.length - 1];
    tokens: for (let def of tokenDefs) {
      let expectedState = def.requiredState || def.popState;

      // If the token requires a certain state and we're not in it, or the state
      // only wants to accept tokens that require it and this token doesn't, move on.
      if ((expectedState || state?.exclusive) && expectedState !== state) {
        continue tokens;
      }

      let token = def.match(current, offset);
      if (token?.content.length) {
        offset += token.content.length;
        if (!def.silent) {
          tokens.push(token);
        }

        if (def.popState) {
          if (def.popState !== state) {
            throw new Error(
              `Expected to pop state ${def.popState.name}, but was in state ${
                state?.name ?? '<initial>'
              }`
            );
          }

          stateStack.pop();
        }

        if (def.pushState) {
          stateStack.push(def.pushState);
        }

        continue advance;
      }
    }
    throw new TokenizerError(offset);
  }

  tokens.push({ kind: EOF, offset, content: '' });

  return { tokens, state: stateStack };
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

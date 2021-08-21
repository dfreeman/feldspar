import { alt, defer, maybe, repeatOneSep, seq, token } from '..';
import { state } from './token';
import { tokenize, discoverTokenDefinitions, EOF } from './tokenize';

describe('Tokenization', () => {
  let a = token('a');
  let b = token(/b+/);
  let c = token('c', { kind: 'C' });
  let d = token('d', { silent: true });
  let e = token(/ab/, { kind: 'e', priority: 2 });
  let f = token(/ab/, { kind: 'f', priority: 1 });
  let g = token(/ab/, { kind: 'g', priority: 3 });

  test('tokenize', () => {
    let tokens = [f, e, g, a, b, c, d];

    expect(tokenize('abadbbcd', tokens).tokens).toEqual([
      { kind: 'f', content: 'ab', offset: 0 },
      { kind: 'a', content: 'a', offset: 2 },
      { kind: '/b+/', content: 'bb', offset: 4 },
      { kind: 'C', content: 'c', offset: 6 },
      { kind: EOF, content: '', offset: 8 },
    ]);
  });

  test('discoverTokens', () => {
    let entry = defer<unknown>(() =>
      seq(
        alt(a, b),
        maybe(c),
        repeatOneSep(f, alt(e, g)).map(() => 'f')
      )
    );

    expect(discoverTokenDefinitions(entry, [d])).toEqual([f, e, g, d, a, b, c]);
  });

  test('tokenization states', () => {
    let inc = state('inclusive');
    let exc = state('exclusive', { exclusive: true });

    let lparen = token('(', { pushState: inc });
    let rparen = token(')', { popState: inc });
    let lbrack = token('[', { pushState: exc });
    let rbrack = token(']', { popState: exc });

    let a = token('a');
    let bInc = token('b', { kind: 'b-in-inc', requiredState: inc });
    let bExc = token('b', { kind: 'b-in-exc', requiredState: exc });

    let tokens = [lparen, rparen, lbrack, rbrack, a, bInc, bExc];
    let tok = (input: string): Array<string> =>
      tokenize(input, tokens).tokens.map((t) => t.kind);

    expect(tok('a')).toEqual(['a', EOF]);
    expect(tok('(a)')).toEqual(['(', 'a', ')', EOF]);
    expect(() => tok('[a]')).toThrow();

    expect(() => tok('b')).toThrow();
    expect(tok('(b)')).toEqual(['(', 'b-in-inc', ')', EOF]);
    expect(tok('[b]')).toEqual(['[', 'b-in-exc', ']', EOF]);
    expect(tok('(b[b])')).toEqual([
      '(',
      'b-in-inc',
      '[',
      'b-in-exc',
      ']',
      ')',
      EOF,
    ]);
  });
});

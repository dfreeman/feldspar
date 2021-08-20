import { alt, defer, maybe, repeatOneSep, seq, token } from '..';
import { tokenize, discoverTokenDefinitions } from './tokenize';

describe('Tokenization', () => {
  let a = token('a');
  let b = token(/b+/);
  let c = token({ kind: 'C', pattern: 'c' });
  let d = token({ pattern: 'd', silent: true });
  let e = token({ kind: 'e', pattern: /ab/, priority: 2 });
  let f = token({ kind: 'f', pattern: /ab/, priority: 1 });
  let g = token({ kind: 'g', pattern: /ab/, priority: 3 });

  test('tokenize', () => {
    let tokens = [f, e, g, a, b, c, d];

    expect(tokenize('abadbbcd', tokens)).toEqual([
      { kind: 'f', content: 'ab', offset: 0 },
      { kind: 'a', content: 'a', offset: 2 },
      { kind: '/b+/', content: 'bb', offset: 4 },
      { kind: 'C', content: 'c', offset: 6 },
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
});

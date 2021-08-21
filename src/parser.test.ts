import { alt, defer, ParseError, Parser, repeat, seq, state, token } from '.';
import { EOF } from './parser/tokenize';

describe('Parser', () => {
  test('tokenizing', () => {
    let inner = state('inner');
    let goIn = token('>', { pushState: inner, silent: true });
    let goOut = token('<', { popState: inner, silent: true });
    let aOuter = token('a', { kind: 'aOuter' });
    let aInner = token('a', {
      kind: 'aInner',
      requiredState: inner,
      priority: 0,
    });

    let parser = new Parser(repeat(alt(aOuter, aInner)), [goIn, goOut]);

    expect(parser.tokenize('aa')).toEqual({
      state: [],
      tokens: [
        { kind: 'aOuter', content: 'a', offset: 0 },
        { kind: 'aOuter', content: 'a', offset: 1 },
        { kind: EOF, content: '', offset: 2 },
      ],
    });

    expect(parser.tokenize('>>>')).toEqual({
      state: [inner, inner, inner],
      tokens: [{ kind: EOF, content: '', offset: 3 }],
    });

    expect(parser.tokenize('a>>a<a')).toEqual({
      state: [inner],
      tokens: [
        { kind: 'aOuter', content: 'a', offset: 0 },
        { kind: 'aInner', content: 'a', offset: 3 },
        { kind: 'aInner', content: 'a', offset: 5 },
        { kind: EOF, content: '', offset: 6 },
      ],
    });
  });

  test('errors', () => {
    let ws = token(/\s+/, { silent: true });
    let int = token(/\d+/, { kind: 'Int' }).map((tok) => tok.content);
    let op = alt(token('+'), token('*')).map((tok) => tok.content);
    let expr = defer<string>((expr) =>
      alt(
        seq(expr, op, expr).map((parts) => `(${parts.join(' ')})`),
        int
      )
    );

    let parser = new Parser(expr, [ws]);

    try {
      parser.parse('22*33 44+55');
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);

      let parseError = error as ParseError;
      let expected = [...parseError.expected].map((tok) => tok.kind);

      expect(new Set(expected)).toEqual(new Set(['*', '+']));
      expect(parseError.found.kind).toEqual('Int');
      expect(parseError.offset).toEqual(6);
      expect(parseError.length).toEqual(2);
    }
  });
});

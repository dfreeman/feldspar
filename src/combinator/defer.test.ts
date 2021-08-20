import { expectTypeOf } from 'expect-type';
import { Parser, defer, token, empty, Token, alt, seq } from '..';

describe('Combinator | defer', () => {
  test('passthrough', () => {
    let parser = new Parser(defer(() => token('hi')));

    expectTypeOf(parser).toEqualTypeOf<Parser<Token>>();
    expect(parser.parse('hi')).toEqual({
      kind: 'hi',
      content: 'hi',
      offset: 0,
    });
  });

  test('self reference', () => {
    let digit = token(/\d/).map((token) => Number(token.content));
    let digits = defer<Array<number>>((digits) =>
      alt(
        empty([]),
        seq(digit, digits).map(([head, tail]) => [head, ...tail])
      )
    );

    let parser = new Parser(digits);

    expectTypeOf(parser).toEqualTypeOf<Parser<Array<number>>>();
    expect(parser.parse('')).toEqual([]);
    expect(parser.parse('1')).toEqual([1]);
    expect(parser.parse('123')).toEqual([1, 2, 3]);
  });
});

import { expectTypeOf } from 'expect-type';
import { Parser, seq, token } from '..';
import { Token } from '../parser/token';

describe('Combinator | seq', () => {
  test('empty', () => {
    let parser = new Parser(seq());

    expectTypeOf(parser).toEqualTypeOf<Parser<[]>>();
    expect(() => parser.parse('hi')).toThrow(/unrecognized token/i);
    expect(parser.parse('')).toEqual([]);
  });

  test('single alternative', () => {
    let parser = new Parser(seq(token('hi').map(() => 123)));

    expectTypeOf(parser).toEqualTypeOf<Parser<[number]>>();
    expect(parser.parse('hi')).toEqual([123]);
    expect(() => parser.parse('boom')).toThrow(/unrecognized token/i);
  });

  test('multiple alternatives', () => {
    let parser = new Parser(
      seq(
        token(/a+/),
        token(/bc/).map(() => 'the bc thing')
      )
    );

    expectTypeOf(parser).toEqualTypeOf<Parser<[Token, string]>>();

    expect(parser.parse('abc')).toEqual([
      {
        kind: '/a+/',
        offset: 0,
        content: 'a',
      },
      'the bc thing',
    ]);

    expect(parser.parse('aaabc')).toEqual([
      {
        kind: '/a+/',
        offset: 0,
        content: 'aaa',
      },
      'the bc thing',
    ]);

    expect(parser.parse('aaa')).toEqual(null);
    expect(parser.parse('bc')).toEqual(null);
  });
});

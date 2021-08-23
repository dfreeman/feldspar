import { expectTypeOf } from 'expect-type';
import { Parser, alt, token } from '..';
import { NoResultError, TokenizerError } from '../parser/errors';
import { Token } from '../parser/token';

describe('Combinator | alt', () => {
  test('no alternatives', () => {
    let parser = new Parser(alt());

    expectTypeOf(parser).toEqualTypeOf<Parser<never>>();
    expect(() => parser.parse('hi')).toThrow(TokenizerError);
    expect(() => parser.parse('')).toThrow(NoResultError);
  });

  test('single alternative', () => {
    let parser = new Parser(alt(token('hi').map(() => 123)));

    expectTypeOf(parser).toEqualTypeOf<Parser<number>>();
    expect(parser.parse('hi')).toEqual(123);
    expect(() => parser.parse('boom')).toThrow(TokenizerError);
  });

  test('multiple alternatives', () => {
    let parser = new Parser(
      alt(
        token(/a+/),
        token(/bc/).map(() => 'the bc thing')
      )
    );

    expectTypeOf(parser).toEqualTypeOf<Parser<Token | string>>();

    expect(parser.parse('a')).toEqual({
      kind: '/a+/',
      offset: 0,
      content: 'a',
    });

    expect(parser.parse('aaa')).toEqual({
      kind: '/a+/',
      offset: 0,
      content: 'aaa',
    });

    expect(parser.parse('bc')).toEqual('the bc thing');

    expect(() => parser.parse('ab')).toThrow(TokenizerError);
  });
});

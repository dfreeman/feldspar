import { expectTypeOf } from 'expect-type';
import { Parser, token, maybe } from '..';

describe('Combinator | maybe', () => {
  test('may or may not match', () => {
    let parser = new Parser(
      maybe(token('hi')).map((token) => ({ value: token?.content }))
    );

    expectTypeOf(parser).toEqualTypeOf<Parser<{ value: string | undefined }>>();
    expect(parser.parse('')).toEqual({ value: undefined });
    expect(parser.parse('hi')).toEqual({ value: 'hi' });
  });
});

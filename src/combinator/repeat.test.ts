import { expectTypeOf } from 'expect-type';
import { Parser, token, repeat } from '..';
import { repeatOne, repeatOneSep, repeatSep } from './repeat';

describe('Combinator | repeat', () => {
  test('repeat', () => {
    let parser = new Parser(repeat(token('a').map((tok) => tok.content)));

    expectTypeOf(parser).toEqualTypeOf<Parser<Array<string>>>();
    expect(parser.parse('')).toEqual([]);
    expect(parser.parse('a')).toEqual(['a']);
    expect(parser.parse('aaa')).toEqual(['a', 'a', 'a']);
  });

  test('repeatSep', () => {
    let parser = new Parser(
      repeatSep(
        token('a').map((tok) => tok.content),
        token(/\s+/)
      )
    );

    expectTypeOf(parser).toEqualTypeOf<Parser<Array<string>>>();
    expect(parser.parse('')).toEqual([]);
    expect(parser.parse('  ')).toEqual(null);
    expect(parser.parse('a')).toEqual(['a']);
    expect(parser.parse('  a')).toEqual(null);
    expect(parser.parse('a  ')).toEqual(null);
    expect(parser.parse('a a    a')).toEqual(['a', 'a', 'a']);
  });

  test('repeatOne', () => {
    let parser = new Parser(repeatOne(token('a').map((tok) => tok.content)));

    expectTypeOf(parser).toEqualTypeOf<Parser<Array<string>>>();
    expect(parser.parse('')).toEqual(null);
    expect(parser.parse('a')).toEqual(['a']);
    expect(parser.parse('aaa')).toEqual(['a', 'a', 'a']);
  });

  test('repeatOneSep', () => {
    let parser = new Parser(
      repeatOneSep(
        token('a').map((tok) => tok.content),
        token(/\s+/)
      )
    );

    expectTypeOf(parser).toEqualTypeOf<Parser<Array<string>>>();
    expect(parser.parse('')).toEqual(null);
    expect(parser.parse('  ')).toEqual(null);
    expect(parser.parse('a')).toEqual(['a']);
    expect(parser.parse('  a')).toEqual(null);
    expect(parser.parse('a  ')).toEqual(null);
    expect(parser.parse('a a    a')).toEqual(['a', 'a', 'a']);
  });
});

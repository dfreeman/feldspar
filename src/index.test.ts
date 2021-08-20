import { seq, alt, defer, Parser, token } from '.';

describe('Feldspar', () => {
  test('ambiguous structure', () => {
    let int = token(/\d+/).map((tok) => tok.content);
    let plus = token('+').map((tok) => tok.content);
    let expr = defer<string>((expr) =>
      alt(
        seq(expr, plus, expr).map((parts) => `(${parts.join(' ')})`),
        int
      )
    );

    let parser = new Parser(expr);
    let results = [...parser.parseAll('1+2+3+4')];

    expect(results.sort()).toEqual([
      '(((1 + 2) + 3) + 4)',
      '((1 + (2 + 3)) + 4)',
      '((1 + 2) + (3 + 4))',
      '(1 + ((2 + 3) + 4))',
      '(1 + (2 + (3 + 4)))',
    ]);
  });

  test('README example', () => {
    type Expr = number | [Expr, Op, Expr];

    enum Op {
      Add,
      Multiply,
    }

    let int = token(/\d+/).map((token) => Number(token.content));
    let plus = token('+').map(() => Op.Add);
    let times = token('*').map(() => Op.Multiply);
    let expr = defer<Expr>((expr) =>
      alt(int, seq(expr, alt(plus, times), expr))
    );

    let parser = new Parser(expr);

    expect(parser.parse('2+2')).toEqual([2, Op.Add, 2]);
    expect(parser.parse('2+3+4')).toEqual([[2, Op.Add, 3], Op.Add, 4]);

    expect([...parser.parseAll('2+2')]).toEqual([[2, Op.Add, 2]]);
    expect([...parser.parseAll('2+3+4')]).toEqual([
      [[2, Op.Add, 3], Op.Add, 4],
      [2, Op.Add, [3, Op.Add, 4]],
    ]);
  });
});

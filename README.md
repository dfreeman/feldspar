# Feldspar [![CI status](https://github.com/dfreeman/feldspar/workflows/CI/badge.svg)](https://github.com/dfreeman/feldspar/actions?query=workflow%3ACI)

This is a toy parser combinator system based off of the Racket GLL parser library described in [this article](https://epsil.github.io/gll/).

It makes no attempt to be particularly fast or robust, and it offers minimal error reporting and no recovery, but it will happily handle left recursion and ambiguous grammars, and all rules and resulting parsers are fully typechecked.

## Overview

Typical usage will involve composing combinators to create grammar rules and then instantiating a parser anchored to your entry rule.

```ts
import { Parser, token, defer, alt, seq } from 'feldspar';

type Expr = number | [Expr, Op, Expr];

enum Op {
  Add,
  Multiply,
}

// Any contiguous sequence of digits will be parsed as a number
let int = token(/\d+/).map((token) => Number(token.content));

// The literals `+` and `*` will produce `Op` enum members
let plus = token('+').map(() => Op.Add);
let times = token('*').map(() => Op.Multiply);

// Since `expr` is self-referential, we wrap it in `defer()` and define it
// as either an int or two subexpressions joined by a `+` or `*`.
let expr = defer<Expr>((expr) => alt(int, seq(expr, alt(plus, times), expr)));

let parser = new Parser(expr);

// `parse()` will return the first successful parse (or `null` on failure)
expect(parser.parse('2+2')).toEqual([2, Op.Add, 2]);
expect(parser.parse('2+3+4')).toEqual([[2, Op.Add, 3], Op.Add, 4]);

// `parseAll()` will return an array of all successful parses
expect([...parser.parseAll('2+2')]).toEqual([[2, Op.Add, 2]]);
expect([...parser.parseAll('2+3+4')]).toEqual([
  [[2, Op.Add, 3], Op.Add, 4],
  [2, Op.Add, [3, Op.Add, 4]],
]);
```

## Detailed Usage

Currently this library is just a toy for quick use in side projects. The tests and type declarations may provide some insight into how to use it, but further documentation won't likely be forthcoming unless others stumble across this and find it useful.

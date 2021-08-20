import { Combinator, empty } from '../combinator';
import { alt } from './alt';
import { defer } from './defer';
import { seq } from './seq';

export function repeat<T>(combinator: Combinator<T>): Combinator<Array<T>> {
  return defer((self) =>
    alt(
      seq(combinator, self).map(([el, list]) => [el, ...list]),
      empty<Array<T>>([])
    )
  );
}

export function repeatSep<T>(
  combinator: Combinator<T>,
  sep: Combinator<unknown>
): Combinator<Array<T>> {
  return alt(repeatOneSep(combinator, sep), empty([]));
}

export function repeatOne<T>(combinator: Combinator<T>): Combinator<Array<T>> {
  return seq(combinator, repeat(combinator)).map(([el, rest]) => [el, ...rest]);
}

export function repeatOneSep<T>(
  combinator: Combinator<T>,
  sep: Combinator<unknown>
): Combinator<Array<T>> {
  return seq(
    combinator,
    repeat(seq(sep, combinator).map((data) => data[1]))
  ).map(([head, tail]) => [head, ...tail]);
}

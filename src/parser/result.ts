import { Token } from './token';

export type Continuation<T = unknown> = (arg: Result<T>) => void;
export type ParseState = { tokens: ReadonlyArray<Token>; index: number };

export type Result<T> =
  | Readonly<{ success: true; value: T; state: ParseState }>
  | Readonly<{ success: false }>;

export function failure(): Result<never> {
  return { success: false };
}

export function success<T>(value: T, state: ParseState): Result<T> {
  return { success: true, value, state };
}

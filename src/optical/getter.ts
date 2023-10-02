/**
 * @packageDocumentation
 * Extraction combinator for a data structure.
 * ```text
 * S --[ extract ]--> A

 * T <--------------- T
 * ```
 */

export interface Getter<S, A> {
    <T>(over: (a: A) => T): (s: S) => T;
}

export const newGetter =
    <S, A>(getter: (s: S) => A): Getter<S, A> =>
    (over) =>
    (s) =>
        over(getter(s));

export type Getting<R, S, A> = (over: (a: A) => R) => (s: S) => R;

export const gets =
    <S>(s: S) =>
    <A>(l: Getting<A, S, A>): A =>
        l((a) => a)(s);

export type Tuple<A, B> = [A, B];

export const first = <A, B>([a]: [A, B]): A => a;
export const second = <A, B>([, b]: [A, B]): B => b;

export const curry =
    <A, B, C>(f: (tuple: [A, B]) => C) =>
    (a: A) =>
    (b: B): C =>
        f([a, b]);

export const uncurry =
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    ([a, b]: [A, B]): C =>
        f(a)(b);

export const swap = <A, B>([a, b]: [A, B]): [B, A] => [b, a];

declare const tupleHktNominal: unique symbol;
export type TupleHktKey = typeof tupleHktNominal;

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [tupleHktNominal]: Tuple<A1, A2>;
    }
}

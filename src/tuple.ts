import type { Applicative1 } from "./type-class/applicative.js";
import type { GetHktA1 } from "./hkt.js";

// TODO: Impl more type instances

export type Tuple<A, B> = readonly [A, B];

export const make =
    <A>(a: A) =>
    <B>(b: B): Tuple<A, B> =>
        [a, b];

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

export const map =
    <A, B>(f: (a: A) => B) =>
    <C>(a: Tuple<C, A>): Tuple<C, B> =>
        [a[0], f(a[1])];

export const foldR: <A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Tuple<A, A>) => B = (folder) => (init) => (data) => {
    const folded = folder(data[1])(init);
    return folder(data[0])(folded);
};

export const traverse =
    <F>(app: Applicative1<F>) =>
    <A, B>(visitor: (a: A) => GetHktA1<F, B>) =>
    ([a1, a2]: [A, A]): GetHktA1<F, Tuple<B, B>> =>
        app.product<B, B>(visitor(a1))(visitor(a2));

declare const tupleHktNominal: unique symbol;
export type TupleHktKey = typeof tupleHktNominal;

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [tupleHktNominal]: Tuple<A1, A2>;
    }
}

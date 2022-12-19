import type { Applicative1 } from "./type-class/applicative.js";
import type { GetHktA1 } from "./hkt.js";
import type { Monad1 } from "./type-class/monad.js";
import type { Traversable1 } from "./type-class/traversable.js";

export type Tuple<A, B> = [A, B];

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

export const product =
    <A>([a1, a2]: [A, A]) =>
    <B>([b1, b2]: [B, B]): [[A, B], [A, B]] =>
        [
            [a1, b1],
            [a2, b2],
        ];

export const pure = <A>(a: A): [A, A] => [a, a];

export const map =
    <A, B>(f: (a: A) => B) =>
    ([a1, a2]: [A, A]): [B, B] =>
        [f(a1), f(a2)];

export const flatMap: <T1, U1>(
    a: (t: T1) => Tuple<U1, U1>,
) => (t: Tuple<T1, T1>) => Tuple<U1, U1> =
    (f) =>
    ([a, b]) =>
        [f(a)[0], f(b)[1]];

export const apply: <T1, U1>(
    fn: Tuple<(t: T1) => U1, (t: T1) => U1>,
) => (t: Tuple<T1, T1>) => Tuple<U1, U1> =
    ([f, g]) =>
    ([a1, a2]) =>
        [f(a1), g(a2)];

export const foldR: <A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Tuple<A, A>) => B = (folder) => (init) => (data) => {
    const folded = folder(data[1])(init);
    return folder(data[0])(folded);
};

export const traverse =
    <F>(app: Applicative1<F>) =>
    <A, B>(visitor: (a: A) => GetHktA1<F, B>) =>
    ([a1, a2]: [A, A]): GetHktA1<F, [B, B]> =>
        app.product<B, B>(visitor(a1))(visitor(a2));

declare const tupleHktNominal: unique symbol;
export type TupleHktKey = typeof tupleHktNominal;

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [tupleHktNominal]: Tuple<A1, A1>;
    }
}

export const monad: Monad1<TupleHktKey> = {
    product,
    pure,
    map,
    flatMap,
    apply,
};

export const traversable: Traversable1<TupleHktKey> = {
    map,
    foldR,
    traverse,
};

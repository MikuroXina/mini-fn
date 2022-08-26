import type { GetHktA1, HktKeyA1 } from "./hkt";
import type { Monad1, Monad2Monoid } from "./type-class/monad";
import { Option, Result } from "./lib";

import type { Applicative1 } from "./type-class/applicative";
import type { Functor1 } from "./type-class/functor";

const pureNominal = Symbol("FreePure");
const nodeNominal = Symbol("FreeNode");

export type Pure<A> = [typeof pureNominal, A];
export type Node<F, A> = [typeof nodeNominal, GetHktA1<F, Free<F, A>>];

export const pure = <A>(a: A): Pure<A> => [pureNominal, a];
export const node = <F, A>(f: GetHktA1<F, Free<F, A>>): Node<F, A> => [nodeNominal, f];

export const isPure = <F extends HktKeyA1, A>(free: Free<F, A>): free is Pure<A> =>
    free[0] === pureNominal;
export const isNode = <F extends HktKeyA1, A>(free: Free<F, A>): free is Node<F, A> =>
    free[0] === nodeNominal;

export type Free<F, A> = Pure<A> | Node<F, A>;

export const retractT =
    <F extends HktKeyA1>(monad: Monad1<F>) =>
    <T>(fr: Free<F, T>): GetHktA1<F, T> => {
        if (isPure(fr)) {
            return monad.pure(fr[1]);
        }
        return monad.flatMap(retractT(monad))(fr[1]);
    };

export const iterT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    <T>(fn: (m: GetHktA1<F, T>) => T) =>
    (fr: Free<F, T>): T => {
        if (isPure(fr)) {
            return fr[1];
        }
        return fn(functor.map(iterT(functor)(fn))(fr[1]));
    };
export const iterA =
    <A extends HktKeyA1, F extends HktKeyA1>(app: Applicative1<A>, functor: Functor1<F>) =>
    <T>(fn: (m: GetHktA1<F, GetHktA1<A, T>>) => GetHktA1<A, T>) =>
    (fr: Free<F, T>): GetHktA1<A, T> => {
        if (isPure(fr)) {
            return app.pure(fr[1]);
        }
        return fn(functor.map(iterA(app, functor)(fn))(fr[1]));
    };

export const hoistFreeT =
    <G extends HktKeyA1>(functor: Functor1<G>) =>
    <F extends HktKeyA1>(fn: <T>(f: GetHktA1<F, T>) => GetHktA1<G, T>) =>
    <T>(fr: Free<F, T>): Free<G, T> => {
        if (isPure(fr)) {
            return fr;
        }
        return node(functor.map(hoistFreeT(functor)(fn))(fn(fr[1])));
    };

export const productT =
    <F extends HktKeyA1>(app: Applicative1<F>) =>
    <A>(a: Free<F, A>) =>
    <B>(b: Free<F, B>): Free<F, [A, B]> => {
        if (isNode(a)) {
            const mapped = app.map(productT(app))(a[1]);
            const applied = app.apply<Free<F, B>, Free<F, [A, B]>>(mapped)(app.pure(b));
            return node(applied);
        }
        if (isNode(b)) {
            return node(app.map(productT(app)(a))(b[1]));
        }
        return pure<[A, B]>([a[1], b[1]]);
    };

export const foldFreeT =
    <M extends HktKeyA1>(m: Monad1<M>) =>
    <F extends HktKeyA1>(fn: <T>(f: GetHktA1<F, T>) => GetHktA1<M, T>) =>
    <T>(fr: Free<F, T>): GetHktA1<M, T> => {
        if (isPure(fr)) {
            return m.pure(fr[1]);
        }
        return m.flatMap(foldFreeT(m)(fn))(fn(fr[1]));
    };

export const mapT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    <T, U>(f: (t: T) => U) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return pure(f(t[1]));
        }
        return node(functor.map(mapT(functor)(f))(t[1]));
    };

export const flatMapT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    <T, U>(mf: (t: T) => Free<F, U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return mf(t[1]);
        }
        return node(functor.map(flatMapT(functor)(mf))(t[1]));
    };

export const applyT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    <T, U>(mf: Free<F, (t: T) => U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            if (isPure(mf)) {
                return pure(mf[1](t[1]));
            }
            const applied = (rest: Free<F, (t: T) => U>) => applyT(functor)(rest)(t);
            return node(functor.map(applied)(mf[1]));
        }
        return node(functor.map(applyT(functor)(mf))(t[1]));
    };

export const cutoffT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    (n: number) =>
    <T>(fr: Free<F, T>): Free<F, Option.Option<T>> => {
        if (n <= 0) {
            return pure(Option.none());
        }
        if (isNode(fr)) {
            return node(functor.map(cutoffT(functor)(n - 1))(fr[1]));
        }
        const some = (x: T): Option.Option<T> => Option.some(x);
        return mapT(functor)(some)(fr);
    };

export const unfoldT =
    <F extends HktKeyA1>(functor: Functor1<F>) =>
    <A, B>(fn: (b: B) => Result.Result<A, GetHktA1<F, B>>) =>
    (seed: B): Free<F, A> =>
        Result.either((a: A): Free<F, A> => pure(a))((fb: GetHktA1<F, B>) =>
            node(functor.map(unfoldT(functor)(fn))(fb)),
        )(fn(seed));

declare const freeHktNominal: unique symbol;
export type FreeHktKey = typeof freeHktNominal;

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [freeHktNominal]: Free<A1, A2>;
    }
}

export const monad = <F extends HktKeyA1>(app: Applicative1<F>): Monad2Monoid<FreeHktKey, F> => ({
    product: productT(app),
    pure,
    map: mapT(app),
    flatMap: flatMapT(app),
    apply: applyT(app),
});

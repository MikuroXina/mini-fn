import * as Option from "./option.js";
import * as Result from "./result.js";

import { Monad1, Monad2Monoid, kleisli } from "./type-class/monad.js";

import type { Applicative1 } from "./type-class/applicative.js";
import type { Functor1 } from "./type-class/functor.js";
import type { GetHktA1 } from "./hkt.js";
import type { Traversable1 } from "./type-class/traversable.js";
import type { Tuple } from "./tuple.js";

const pureNominal = Symbol("FreePure");
const nodeNominal = Symbol("FreeNode");

export type Pure<A> = readonly [typeof pureNominal, A];
export type Node<F, A> = readonly [typeof nodeNominal, GetHktA1<F, Free<F, A>>];

export const pure = <A>(a: A): Pure<A> => [pureNominal, a];
export const node = <F, A>(f: GetHktA1<F, Free<F, A>>): Node<F, A> => [nodeNominal, f];

export const isPure = <F, A>(free: Free<F, A>): free is Pure<A> => free[0] === pureNominal;
export const isNode = <F, A>(free: Free<F, A>): free is Node<F, A> => free[0] === nodeNominal;

export type Free<F, A> = Pure<A> | Node<F, A>;

export const retract =
    <F>(monad: Monad1<F>) =>
    <T>(fr: Free<F, T>): GetHktA1<F, T> => {
        if (isPure(fr)) {
            return monad.pure(fr[1]);
        }
        return monad.flatMap(retract(monad))(fr[1]);
    };

export const iter =
    <F>(functor: Functor1<F>) =>
    <T>(fn: (m: GetHktA1<F, T>) => T) =>
    (fr: Free<F, T>): T => {
        if (isPure(fr)) {
            return fr[1];
        }
        return fn(functor.map(iter(functor)(fn))(fr[1]));
    };
export const iterA =
    <A, F>(app: Applicative1<A>, functor: Functor1<F>) =>
    <T>(fn: (m: GetHktA1<F, GetHktA1<A, T>>) => GetHktA1<A, T>) =>
    (fr: Free<F, T>): GetHktA1<A, T> => {
        if (isPure(fr)) {
            return app.pure(fr[1]);
        }
        return fn(functor.map(iterA(app, functor)(fn))(fr[1]));
    };
export const iterM =
    <M, F>(monad: Monad1<M>, functor: Functor1<F>) =>
    <A>(fn: (fma: GetHktA1<F, GetHktA1<M, A>>) => GetHktA1<M, A>) =>
    (f: Free<F, A>): GetHktA1<M, A> => {
        if (isPure(f)) {
            return monad.pure(f[1]);
        }
        return fn(functor.map(iterM(monad, functor)(fn))(f[1]));
    };

export const hoistFree =
    <G>(functor: Functor1<G>) =>
    <F>(fn: <T>(f: GetHktA1<F, T>) => GetHktA1<G, T>) =>
    <T>(fr: Free<F, T>): Free<G, T> => {
        if (isPure(fr)) {
            return fr;
        }
        return node(functor.map(hoistFree(functor)(fn))(fn(fr[1])));
    };

export const productT =
    <F>(app: Applicative1<F>) =>
    <A>(a: Free<F, A>) =>
    <B>(b: Free<F, B>): Free<F, Tuple<A, B>> => {
        if (isNode(a)) {
            const mapped = app.map(productT(app))(a[1]);
            const applied = app.apply<Free<F, B>, Free<F, Tuple<A, B>>>(mapped)(app.pure(b));
            return node(applied);
        }
        if (isNode(b)) {
            return node(app.map(productT(app)(a))(b[1]));
        }
        return pure<[A, B]>([a[1], b[1]]);
    };

export const foldFree =
    <M>(m: Monad1<M>) =>
    <F>(fn: <T>(f: GetHktA1<F, T>) => GetHktA1<M, T>) =>
    <T>(fr: Free<F, T>): GetHktA1<M, T> => {
        if (isPure(fr)) {
            return m.pure(fr[1]);
        }
        return m.flatMap(foldFree(m)(fn))(fn(fr[1]));
    };

export const liftF =
    <F>(func: Functor1<F>) =>
    <T>(ft: GetHktA1<F, T>): Free<F, T> =>
        node(func.map<T, Free<F, T>>(pure)(ft));

export const mapT =
    <F>(functor: Functor1<F>) =>
    <T, U>(f: (t: T) => U) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return pure(f(t[1]));
        }
        return node(functor.map(mapT(functor)(f))(t[1]));
    };

export const flatMapT =
    <F>(functor: Functor1<F>) =>
    <T, U>(mf: (t: T) => Free<F, U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return mf(t[1]);
        }
        return node(functor.map(flatMapT(functor)(mf))(t[1]));
    };

export const applyT =
    <F>(functor: Functor1<F>) =>
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

export const cutoff =
    <F>(functor: Functor1<F>) =>
    (n: number) =>
    <T>(fr: Free<F, T>): Free<F, Option.Option<T>> => {
        if (n <= 0) {
            return pure(Option.none());
        }
        if (isNode(fr)) {
            return node(functor.map(cutoff(functor)(n - 1))(fr[1]));
        }
        const some = (x: T): Option.Option<T> => Option.some(x);
        return mapT(functor)(some)(fr);
    };

export const unfold =
    <F>(functor: Functor1<F>) =>
    <A, B>(fn: (b: B) => Result.Result<A, GetHktA1<F, B>>) =>
    (seed: B): Free<F, A> =>
        Result.either((a: A): Free<F, A> => pure(a))((fb: GetHktA1<F, B>) =>
            node(functor.map(unfold(functor)(fn))(fb)),
        )(fn(seed));
export const unfoldM =
    <F, M>(traversable: Traversable1<F>, monad: Monad1<M>) =>
    <A, B>(
        f: (b: B) => GetHktA1<M, Result.Result<A, GetHktA1<F, B>>>,
    ): ((b: B) => GetHktA1<M, Free<F, A>>) => {
        return kleisli(monad)(f)(
            Result.either((a: A) => monad.pure(pure(a) as Free<F, A>))((fb) =>
                monad.map((ffa: GetHktA1<F, Free<F, A>>) => node(ffa) as Free<F, A>)(
                    traversable.traverse(monad)(unfoldM(traversable, monad)(f))(fb),
                ),
            ),
        );
    };

declare const freeHktNominal: unique symbol;
export type FreeHktKey = typeof freeHktNominal;

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [freeHktNominal]: Free<A1, A2>;
    }
}

export const monad = <F>(app: Applicative1<F>): Monad2Monoid<FreeHktKey, F> => ({
    product: productT(app),
    pure,
    map: mapT(app),
    flatMap: flatMapT(app),
    apply: applyT(app),
});

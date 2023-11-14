import { doT } from "../cat.ts";
import { id, pipe } from "../func.ts";
import type { Get1 } from "../hkt.ts";
import { monad as idMonad } from "../identity.ts";
import type { Applicative } from "./applicative.ts";
import type { FlatMap } from "./flat-map.ts";

export interface Monad<S> extends Applicative<S>, FlatMap<S> {}

export const flat = <S>(
    m: Monad<S>,
): <A>(a: Get1<S, Get1<S, A>>) => Get1<S, A> => m.flatMap(id);

export const flatMap2 =
    <S>(m: Monad<S>) =>
    <A, B, C>(f: (a: A) => (mb: Get1<S, B>) => Get1<S, C>) =>
    (ma: Get1<S, A>) =>
    (mb: Get1<S, B>): Get1<S, C> => m.flatMap((a: A) => f(a)(mb))(ma);

export const flatMap3 = <S>(m: Monad<S>) =>
<A, B, C, D>(
    f: (a: A) => (mb: Get1<S, B>) => (mc: Get1<S, C>) => Get1<S, D>,
) =>
(ma: Get1<S, A>) =>
(mb: Get1<S, B>) =>
(mc: Get1<S, C>): Get1<S, D> => m.flatMap((a: A) => f(a)(mb)(mc))(ma);

export const flatMap4 = <S>(m: Monad<S>) =>
<A, B, C, D, E>(
    f: (
        a: A,
    ) => (mb: Get1<S, B>) => (mc: Get1<S, C>) => (md: Get1<S, D>) => Get1<S, E>,
) =>
(ma: Get1<S, A>) =>
(mb: Get1<S, B>) =>
(mc: Get1<S, C>) =>
(md: Get1<S, D>): Get1<S, E> => m.flatMap((a: A) => f(a)(mb)(mc)(md))(ma);

export const flatMap5 = <S>(m: Monad<S>) =>
<A, B, C, D, E, F>(
    f: (
        a: A,
    ) => (
        mb: Get1<S, B>,
    ) => (mc: Get1<S, C>) => (md: Get1<S, D>) => (me: Get1<S, E>) => Get1<S, F>,
) =>
(ma: Get1<S, A>) =>
(mb: Get1<S, B>) =>
(mc: Get1<S, C>) =>
(md: Get1<S, D>) =>
(me: Get1<S, E>): Get1<S, F> => m.flatMap((a: A) => f(a)(mb)(mc)(md)(me))(ma);

export const liftM = <S>(
    m: Monad<S>,
): <A, B>(f: (a: A) => B) => (ma: Get1<S, A>) => Get1<S, B> => m.map;

export const liftM2 =
    <S>(m: Monad<S>) =>
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    (ma: Get1<S, A>) =>
    (mb: Get1<S, B>): Get1<S, C> =>
        doT(m)
            .addM("a", ma)
            .addM("b", mb)
            .finish(({ a, b }) => f(a)(b));

export const liftM3 =
    <S>(m: Monad<S>) =>
    <A, B, C, D>(f: (a: A) => (b: B) => (c: C) => D) =>
    (ma: Get1<S, A>) =>
    (mb: Get1<S, B>) =>
    (mc: Get1<S, C>): Get1<S, D> =>
        doT(m)
            .addM("a", ma)
            .addM("b", mb)
            .addM("c", mc)
            .finish(({ a, b, c }) => f(a)(b)(c));

export const liftM4 =
    <S>(m: Monad<S>) =>
    <A, B, C, D, E>(f: (a: A) => (b: B) => (c: C) => (d: D) => E) =>
    (ma: Get1<S, A>) =>
    (mb: Get1<S, B>) =>
    (mc: Get1<S, C>) =>
    (md: Get1<S, D>): Get1<S, E> =>
        doT(m)
            .addM("a", ma)
            .addM("b", mb)
            .addM("c", mc)
            .addM("d", md)
            .finish(({ a, b, c, d }) => f(a)(b)(c)(d));

export const liftM5 = <S>(m: Monad<S>) =>
<A, B, C, D, E, F>(
    f: (a: A) => (b: B) => (c: C) => (d: D) => (e: E) => F,
) =>
(ma: Get1<S, A>) =>
(mb: Get1<S, B>) =>
(mc: Get1<S, C>) =>
(md: Get1<S, D>) =>
(me: Get1<S, E>): Get1<S, F> =>
    doT(m)
        .addM("a", ma)
        .addM("b", mb)
        .addM("c", mc)
        .addM("d", md)
        .addM("e", me)
        .finish(({ a, b, c, d, e }) => f(a)(b)(c)(d)(e));

export const begin = <S>(m: Monad<S>): Get1<S, object> => m.pure({});

export type Append<A extends object, NK extends PropertyKey, B> =
    & A
    & {
        readonly [K in keyof A | NK]: K extends keyof A ? A[K] : B;
    };

export const bindT =
    <S>(m: Monad<S>) =>
    <B>(f: () => Get1<S, B>) =>
    <NK extends PropertyKey>(
        name: NK,
    ): <A extends object>(ma: Get1<S, A>) => Get1<S, Append<A, NK, B>> =>
        m.flatMap(
            <A extends object>(a: A): Get1<S, Append<A, NK, B>> =>
                m.map((b: B): Append<A, NK, B> =>
                    ({ ...a, [name]: b }) as Append<A, NK, B>
                )(f()),
        );

export const bind = bindT(idMonad);

export const kleisli =
    <S>(monad: Monad<S>) =>
    <A, B>(f: (a: A) => Get1<S, B>) =>
    <C>(g: (b: B) => Get1<S, C>): (a: A) => Get1<S, C> =>
        pipe(f)(monad.flatMap(g));

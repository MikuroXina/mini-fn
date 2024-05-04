import { flip } from "../func.ts";
import type { Get1, Get2 } from "../hkt.ts";
import { id } from "../identity.ts";
import { isNone, mapOr, none, type Option, some } from "../option.ts";
import { monoid } from "./endo.ts";
import type { Monad } from "./monad.ts";
import type { Monoid } from "./monoid.ts";

export interface Bifoldable<P> {
    readonly bifoldR: <A, C>(
        aFolder: (a: A) => (c: C) => C,
    ) => <B>(
        bFolder: (b: B) => (c: C) => C,
    ) => (init: C) => (data: Get2<P, A, B>) => C;
}

export const fromBifoldMap = <P>(
    f: <M>(
        m: Monoid<M>,
    ) => <A>(
        aMap: (a: A) => M,
    ) => <B>(bMap: (b: B) => M) => (data: Get2<P, A, B>) => M,
): Bifoldable<P> => ({
    bifoldR:
        <A, C>(aMap: (a: A) => (c: C) => C) =>
        <B>(bMap: (b: B) => (c: C) => C) =>
        (init: C) =>
        (data: Get2<P, A, B>) =>
            f(monoid<C>())((a: A) => (c) => aMap(a)(c))((b: B) => (c) =>
                bMap(b)(c)
            )(data)(init),
});

export const bifoldMap =
    <P>(bi: Bifoldable<P>) =>
    <M>(m: Monoid<M>) =>
    <A>(aMap: (a: A) => M) =>
    <B>(bMap: (b: B) => M): (data: Get2<P, A, B>) => M =>
        bi.bifoldR((a: A) => (c: M) => m.combine(aMap(a), c))(
            (b: B) => (c: M) => m.combine(bMap(b), c),
        )(m.identity);

export const bifold =
    <P>(bi: Bifoldable<P>) => <M>(m: Monoid<M>): (data: Get2<P, M, M>) => M =>
        bifoldMap(bi)(m)(id<M>)(id);

export const bifoldL =
    <P>(bi: Bifoldable<P>) =>
    <A, C>(aFolder: (c: C) => (a: A) => C) =>
    <B>(bFolder: (c: C) => (b: B) => C) =>
    (init: C) =>
    (data: Get2<P, A, B>): C =>
        bifoldMap(bi)(monoid<C>())(flip(aFolder))(flip(bFolder))(data)(init);

export const bifoldRM =
    <P, M>(bi: Bifoldable<P>, m: Monad<M>) =>
    <A, C>(aFolder: (a: A) => (c: C) => Get1<M, C>) =>
    <B>(bFolder: (b: B) => (c: C) => Get1<M, C>) =>
    (init: C) =>
    (data: Get2<P, A, B>): Get1<M, C> =>
        bifoldL(bi)<A, (c: C) => Get1<M, C>>(
            <X>(k: (c: C) => Get1<M, X>) => (x: A) => (z: C): Get1<M, X> =>
                m.flatMap(k)(aFolder(x)(z)),
        )(
            <X>(k: (c: C) => Get1<M, X>) => (x: B) => (z: C): Get1<M, X> =>
                m.flatMap(k)(bFolder(x)(z)),
        )(m.pure)(data)(init);

export const bifoldLM =
    <P, M>(bi: Bifoldable<P>, m: Monad<M>) =>
    <A, C>(aFolder: (c: C) => (a: A) => Get1<M, C>) =>
    <B>(bFolder: (c: C) => (b: B) => Get1<M, C>) =>
    (init: C) =>
    (data: Get2<P, A, B>): Get1<M, C> =>
        bifoldL(bi)<A, (c: C) => Get1<M, C>>(
            <X>(k: (c: C) => Get1<M, X>) => (x: A) => (z: C): Get1<M, X> =>
                m.flatMap(k)(aFolder(z)(x)),
        )(
            <X>(k: (c: C) => Get1<M, X>) => (x: B) => (z: C): Get1<M, X> =>
                m.flatMap(k)(bFolder(z)(x)),
        )(m.pure)(data)(init);

// reduce functions:

export const biReduceR =
    <P>(bi: Bifoldable<P>) =>
    <A>(folder: (l: A) => (r: A) => A) =>
    (data: Get2<P, A, A>): A => {
        const mbf = (x: A) => (m: Option<A>): Option<A> =>
            some(mapOr(x)((y: A) => folder(x)(y))(m));
        const opt = bi.bifoldR(mbf)(mbf)(none())(data);
        if (isNone(opt)) {
            throw new Error("empty structure");
        }
        return opt[1];
    };

export const biReduceL =
    <P>(bi: Bifoldable<P>) =>
    <A>(folder: (l: A) => (r: A) => A) =>
    (data: Get2<P, A, A>): A => {
        const mbf = (m: Option<A>) => (y: A): Option<A> =>
            some(mapOr(y)((x: A) => folder(x)(y))(m));
        const opt = bifoldL(bi)(mbf)(mbf)(none())(data);
        if (isNone(opt)) {
            throw new Error("empty structure");
        }
        return opt[1];
    };

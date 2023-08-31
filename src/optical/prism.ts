import { absurd, compose, type FnHkt } from "../func.js";
import type { Apply2Only, Get1, Get2 } from "../hkt.js";
import { id } from "../identity.js";
import type { Lens, LensLike, Optic } from "../optical.js";
import { mapOr, mapOrElse, none, type Option, some } from "../option.js";
import {
    applicative,
    biMap,
    either,
    err,
    isErr,
    mapErr,
    ok,
    type Result,
    type ResultHkt,
} from "../result.js";
import type { Applicative } from "../type-class/applicative.js";
import type { Choice } from "../type-class/choice.js";
import type { Eq } from "../type-class/eq.js";
import type { Functor } from "../type-class/functor.js";
import { leftMap } from "../type-class/profunctor.js";
import type { Representable } from "../type-class/representable.js";
import type { Traversable } from "../type-class/traversable.js";
import { type Market } from "./market.js";

export type Prism<S, T, A, B> = <P, F>(f: Choice<P> & Applicative<F>) => Optic<P, F, S, T, A, B>;
export type PrismSimple<S, A> = Prism<S, S, A, A>;

export type APrism<S, T, A, B> = (m: Market<A, B, A, B>) => Market<A, B, S, T>;
export type APrismSimple<S, A> = APrism<S, S, A, A>;

export const prism =
    <B, T>(bt: (b: B) => T) =>
    <S, A>(sta: (s: S) => Result<T, A>): Prism<S, T, A, B> =>
    (f) =>
    (paFb) =>
        f.diMap(sta)(either(f.pure)(f.map(bt)))(f.right(paFb));

export const prismSimple =
    <B, S>(bs: (b: B) => S) =>
    <A>(sa: (s: S) => Option<A>): Prism<S, S, A, B> =>
        prism(bs)((s) => mapOr(err(s) as Result<S, A>)((a: A) => ok(a))(sa(s)));

export const withPrism =
    <S, T, A, B>(k: APrism<S, T, A, B>) =>
    <R>(f: (bt: (b: B) => T) => (sta: (s: S) => Result<T, A>) => R): R => {
        const market = k({ bt: id, sta: ok });
        return f(market.bt)(market.sta);
    };

export const clonePrism = <S, T, A, B>(k: APrism<S, T, A, B>): Prism<S, T, A, B> =>
    withPrism(k)(prism);

export const outside =
    <P>(r: Representable<P>) =>
    <S, T, A, B, R>(
        k: APrism<S, T, A, B>,
    ): Lens<Get2<P, T, R>, Get2<P, S, R>, Get2<P, B, R>, Get2<P, A, R>> =>
    <F>(
        functor: Functor<F>,
    ): Optic<FnHkt, F, Get2<P, T, R>, Get2<P, S, R>, Get2<P, B, R>, Get2<P, A, R>> =>
        withPrism(k)(
            (bt) => (seta) => (f) => (ft) =>
                functor.map(
                    (par: Get2<P, A, R>): Get2<P, S, R> =>
                        r.tabulate(compose(either(r.index(ft))(r.index(par)))(seta)),
                )(f(leftMap(r)(bt)(ft))),
        );

export const without =
    <S, T, A, B>(k: APrism<S, T, A, B>) =>
    <U, V, C, D>(
        kk: APrism<U, V, C, D>,
    ): Prism<Result<S, U>, Result<T, V>, Result<A, C>, Result<B, D>> =>
        withPrism(k)(
            (bt) => (sta) =>
                withPrism(kk)(
                    (dv) => (uvc) =>
                        prism(biMap(bt)(dv))((su): Result<Result<T, V>, Result<A, C>> => {
                            if (isErr(su)) {
                                return biMap((t: T) => err(t))(err)(sta(su[1]));
                            }
                            return biMap((v: V) => ok(v))(ok)(uvc(su[1]));
                        }),
                ),
        );

export const aside = <S, T, A, B, E>(
    k: APrism<S, T, A, B>,
): Prism<[E, S], [E, T], [E, A], [E, B]> =>
    withPrism(k)(
        (bt) => (sta) =>
            prism(([e, b]: [E, B]) => [e, bt(b)])(([e, s]: [E, S]): Result<[E, T], [E, A]> => {
                const a = sta(s);
                if (isErr(a)) {
                    return err([e, a[1]]) as Result<[E, T], [E, A]>;
                }
                return ok([e, a[1]]) as Result<[E, T], [E, A]>;
            }),
    );

export const below =
    <F>(f: Traversable<F>) =>
    <S, A>(k: APrismSimple<S, A>): PrismSimple<Get1<F, S>, Get1<F, A>> =>
        withPrism(k)(
            (bt) => (sta) =>
                prism(f.map(bt))((s) => mapErr(() => s)(f.traverse(applicative)(sta)(s))),
        );

export const matching = <S, T, A, B>(k: APrism<S, T, A, B>): ((s: S) => Result<T, A>) =>
    withPrism(k)(() => (seta) => seta);

export const matchingSimple =
    <S, T, A, B>(k: LensLike<Apply2Only<ResultHkt, A>, S, T, A, B>) =>
    (s: S): Result<T, A> =>
        either((a: A) => ok(a) as Result<T, A>)((t: T) => err(t))(k(err)(s));

export const isNot =
    <S, T, A, B>(k: APrism<S, T, A, B>) =>
    (s: S): boolean =>
        either(() => true)(() => false)(matching(k)(s));

// Prism instances:

export const errPrism = <A, B, C>(): Prism<Result<A, C>, Result<B, C>, A, B> =>
    prism((b: B) => err(b) as Result<B, C>)(
        either((a: A) => ok(a) as Result<Result<B, C>, A>)((c) => err(ok(c))),
    );

export const okPrism = <A, B, C>(): Prism<Result<C, A>, Result<C, B>, A, B> =>
    prism((b: B) => ok(b) as Result<C, B>)(
        either((c: C) => err(err(c)) as Result<Result<C, B>, A>)(ok),
    );

export const somePrism = <A, B>(): Prism<Option<A>, Option<B>, A, B> =>
    prism((b: B) => some(b) as Option<B>)(mapOrElse(() => err(none()) as Result<Option<B>, A>)(ok));

export const nonePrism = <A>(): PrismSimple<Option<A>, []> =>
    prismSimple(() => none() as Option<A>)(mapOrElse(() => some([]) as Option<[]>)(none));

export const unreachablePrism = <S, A>(): Prism<S, S, A, never> =>
    prism(absurd<S>)((s: S) => err(s) as Result<S, A>);

export const only =
    <A>(equality: Eq<A>) =>
    (target: A): PrismSimple<A, []> =>
        prismSimple(() => target)((a) => (equality.eq(target, a) ? some([]) : none()));

export const nearly =
    <A>(target: A) =>
    (pred: (a: A) => boolean): PrismSimple<A, []> =>
        prismSimple(() => target)((a) => (pred(a) ? some([]) : none()));

export const marshalPrism = <A>(
    fromString: (s: string) => Option<A>,
    toString: (a: A) => string,
): PrismSimple<string, A> =>
    prism(toString)((s: string) =>
        mapOrElse(() => err(s) as Result<string, A>)((a: A) => ok(a))(fromString(s)),
    );

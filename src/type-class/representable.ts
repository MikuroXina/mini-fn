import { compose, constant, id } from "../func.js";
import type { Get1, Get2, Hkt0 } from "../hkt.js";
import { applyWeak, functor as functorReader } from "../reader.js";
import type { Functor } from "./functor.js";
import type { Monoid } from "./monoid.js";
import type { Profunctor } from "./profunctor.js";
import type { SemiGroup } from "./semi-group.js";

/**
 * An HKT extension to provide associated type `Rep` for `Representable`.
 */
export interface HktRep {
    readonly rep: unknown; // Representation type
}

export type ApplyRep<F, R> = F extends Hkt0 ? F & { readonly rep: R } : never;

export type GetRep<F> = F extends HktRep ? F["rep"] : never;

/**
 * `F` should extend `HktRep` because functions below require `HktRep`.
 *
 * All instances of `Representable` must satisfy these laws:
 *
 * - `compose(index)(tabulate) == id`,
 * - `compose(tabulate)(index) == id`.
 */
export interface Representable<F> extends Functor<F> {
    readonly index: <T>(f: Get1<F, T>) => (rep: GetRep<F>) => T;
    readonly tabulate: <T>(f: (rep: GetRep<F>) => T) => Get1<F, T>;
}

export const tabulated =
    <F, G, P, H>(
        f: Representable<F>,
        g: Representable<G>,
        pro: Profunctor<P>,
        functor: Functor<H>,
    ) =>
    <A, B>(p: Get2<P, Get1<F, A>, Get1<H, Get1<G, B>>>) =>
        pro.diMap(f.tabulate<A>)(functor.map(g.index))(p);

export const map =
    <F>(f: Representable<F>) =>
    <A, B>(fn: (a: A) => B): ((fa: Get1<F, A>) => Get1<F, B>) =>
        compose(f.tabulate<B>)(compose(functorReader<GetRep<F>>().map(fn))(f.index<A>));

export const pure =
    <F>(f: Representable<F>) =>
    <A>(a: A): Get1<F, A> =>
        f.tabulate(constant(a));

export const bind =
    <F>(f: Representable<F>) =>
    <A>(m: Get1<F, A>) =>
    <B>(fn: (a: A) => Get1<F, B>): Get1<F, B> =>
        f.tabulate((a) => f.index(fn(f.index(m)(a)))(a));

export const ask = <F>(f: Representable<F>): Get1<F, GetRep<F>> => f.tabulate(id);

export const local =
    <F>(f: Representable<F>) =>
    (fn: (rep: GetRep<F>) => GetRep<F>) =>
    <A>(m: Get1<F, A>): Get1<F, A> =>
        f.tabulate(compose(f.index(m))(fn));

export const apply =
    <F>(f: Representable<F>) =>
    <A, B>(ab: Get1<F, (a: A) => B>) =>
    (a: Get1<F, A>): Get1<F, B> =>
        f.tabulate(applyWeak(f.index(ab))(f.index(a)));

export const distribute =
    <F, W>(f: Representable<F>, functor: Functor<W>) =>
    <A>(wf: Get1<W, Get1<F, A>>): Get1<F, Get1<W, A>> =>
        f.tabulate((rep) => functor.map((fa: Get1<F, A>) => f.index(fa)(rep))(wf));

export const collect =
    <F, W>(f: Representable<F>, functor: Functor<W>) =>
    <A, B>(ab: (a: A) => Get1<F, B>) =>
    (wa: Get1<W, A>): Get1<F, Get1<W, B>> =>
        f.tabulate((rep) => functor.map(compose((fb: Get1<F, B>) => f.index(fb)(rep))(ab))(wa));

export const duplicateBy =
    <F>(f: Representable<F>) =>
    (plus: (a: GetRep<F>) => (b: GetRep<F>) => GetRep<F>) =>
    <A>(w: Get1<F, A>): Get1<F, Get1<F, A>> =>
        f.tabulate((m) => f.tabulate(compose(f.index(w))(plus(m))));

export const extendBy =
    <F>(f: Representable<F>) =>
    (plus: (a: GetRep<F>) => (b: GetRep<F>) => GetRep<F>) =>
    <A, B>(ab: (fa: Get1<F, A>) => B) =>
    (w: Get1<F, A>): Get1<F, B> =>
        f.tabulate((m) => ab(f.tabulate(compose(f.index(w))(plus(m)))));

export const extractBy =
    <F>(f: Representable<F>) =>
    (rep: GetRep<F>) =>
    <A>(fa: Get1<F, A>): A =>
        f.index(fa)(rep);

export const duplicated = <F>(f: Representable<F>, semiGroup: SemiGroup<GetRep<F>>) =>
    duplicateBy(f)((l) => (r) => semiGroup.combine(l, r));

export const extended = <F>(f: Representable<F>, semiGroup: SemiGroup<GetRep<F>>) =>
    extendBy(f)((l) => (r) => semiGroup.combine(l, r));

export const duplicate = <F>(f: Representable<F>, monoid: Monoid<GetRep<F>>) =>
    duplicateBy(f)((l) => (r) => monoid.combine(l, r));

export const extend = <F>(f: Representable<F>, monoid: Monoid<GetRep<F>>) =>
    extendBy(f)((l) => (r) => monoid.combine(l, r));

export const extract = <F>(f: Representable<F>, monoid: Monoid<GetRep<F>>) =>
    extractBy(f)(monoid.identity);

import type { Get1, Get2, Hkt1, Hkt2 } from "../hkt.js";
import { compose, constant, id } from "../func.js";
import { applyWeak, functor as functorReader } from "../reader.js";
import type { Functor } from "./functor.js";
import type { Profunctor } from "./profunctor.js";
import type { SemiGroup } from "./semi-group.js";
import type { Monoid } from "./monoid.js";

export interface Representable<F extends Hkt1, Rep> extends Functor<F> {
    readonly index: <T>(f: Get1<F, T>) => (rep: Rep) => T;
    readonly tabulate: <T>(f: (rep: Rep) => T) => Get1<F, T>;
}

export const tabulated =
    <F extends Hkt1, G extends Hkt1, Rep, P extends Hkt2, H extends Hkt1>(
        f: Representable<F, Rep>,
        g: Representable<G, Rep>,
        pro: Profunctor<P>,
        functor: Functor<H>,
    ) =>
    <A, B>(p: Get2<P, Get1<F, A>, Get1<H, Get1<G, B>>>) =>
        pro.diMap(f.tabulate<A>)(functor.map(g.index))(p);

export const map =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    <A, B>(fn: (a: A) => B): ((fa: Get1<F, A>) => Get1<F, B>) =>
        compose(f.tabulate<B>)(compose(functorReader<Rep>().map(fn))(f.index<A>));

export const pure =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    <A>(a: A): Get1<F, A> =>
        f.tabulate(constant(a));

export const bind =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    <A>(m: Get1<F, A>) =>
    <B>(fn: (a: A) => Get1<F, B>): Get1<F, B> =>
        f.tabulate((a) => f.index(fn(f.index(m)(a)))(a));

export const ask = <F extends Hkt1, Rep>(f: Representable<F, Rep>): Get1<F, Rep> => f.tabulate(id);

export const local =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    (fn: (rep: Rep) => Rep) =>
    <A>(m: Get1<F, A>): Get1<F, A> =>
        f.tabulate(compose(f.index(m))(fn));

export const apply =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    <A, B>(ab: Get1<F, (a: A) => B>) =>
    (a: Get1<F, A>): Get1<F, B> =>
        f.tabulate(applyWeak(f.index(ab))(f.index(a)));

export const distribute =
    <F extends Hkt1, Rep, W extends Hkt1>(f: Representable<F, Rep>, functor: Functor<W>) =>
    <A>(wf: Get1<W, Get1<F, A>>): Get1<F, Get1<W, A>> =>
        f.tabulate((rep) => functor.map((fa: Get1<F, A>) => f.index(fa)(rep))(wf));

export const collect =
    <F extends Hkt1, Rep, W extends Hkt1>(f: Representable<F, Rep>, functor: Functor<W>) =>
    <A, B>(ab: (a: A) => Get1<F, B>) =>
    (wa: Get1<W, A>): Get1<F, Get1<W, B>> =>
        f.tabulate((rep) => functor.map(compose((fb: Get1<F, B>) => f.index(fb)(rep))(ab))(wa));

export const duplicateBy =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    (plus: (a: Rep) => (b: Rep) => Rep) =>
    <A>(w: Get1<F, A>): Get1<F, Get1<F, A>> =>
        f.tabulate((m) => f.tabulate(compose(f.index(w))(plus(m))));

export const extendBy =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    (plus: (a: Rep) => (b: Rep) => Rep) =>
    <A, B>(ab: (fa: Get1<F, A>) => B) =>
    (w: Get1<F, A>): Get1<F, B> =>
        f.tabulate((m) => ab(f.tabulate(compose(f.index(w))(plus(m)))));

export const extractBy =
    <F extends Hkt1, Rep>(f: Representable<F, Rep>) =>
    (rep: Rep) =>
    <A>(fa: Get1<F, A>): A =>
        f.index(fa)(rep);

export const duplicated = <F extends Hkt1, Rep>(
    f: Representable<F, Rep>,
    semiGroup: SemiGroup<Rep>,
) => duplicateBy(f)((l) => (r) => semiGroup.combine(l, r));

export const extended = <F extends Hkt1, Rep>(
    f: Representable<F, Rep>,
    semiGroup: SemiGroup<Rep>,
) => extendBy(f)((l) => (r) => semiGroup.combine(l, r));

export const duplicate = <F extends Hkt1, Rep>(f: Representable<F, Rep>, monoid: Monoid<Rep>) =>
    duplicateBy(f)((l) => (r) => monoid.combine(l, r));

export const extend = <F extends Hkt1, Rep>(f: Representable<F, Rep>, monoid: Monoid<Rep>) =>
    extendBy(f)((l) => (r) => monoid.combine(l, r));

export const extract = <F extends Hkt1, Rep>(f: Representable<F, Rep>, monoid: Monoid<Rep>) =>
    extractBy(f)(monoid.identity);
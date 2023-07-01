import type { Apply2Only, Apply3Only, Apply4Only, Get1, Get2, Get3, Hkt4 } from "../hkt.js";
import type { Applicative } from "../type-class/applicative.js";
import type { Functor } from "../type-class/functor.js";
import type { Profunctor } from "../type-class/profunctor.js";

export interface Bizarre<P, W> extends Profunctor<P> {
    readonly bazaar: <F>(
        app: Applicative<F>,
    ) => <A, B>(store: Get2<P, A, Get1<F, B>>) => <T>(data: Get3<W, A, B, T>) => Get1<F, T>;
}

export type Bazaar<P, A, B, T> = <F>(
    app: Applicative<F>,
) => (store: Get2<P, A, Get1<F, B>>) => Get1<F, T>;
export type BazaarSimple<P, A, T> = Bazaar<P, A, A, T>;

export const map =
    <T, U>(fn: (t: T) => U) =>
    <P, A, B>(baz: Bazaar<P, A, B, T>): Bazaar<P, A, B, U> =>
    (app) =>
    (k) =>
        app.map(fn)(baz(app)(k));

export const pure =
    <P, A, B, T>(t: T): Bazaar<P, A, B, T> =>
    (app) =>
    () =>
        app.pure(t);

export const apply =
    <P, A, B, T, U>(fn: Bazaar<P, A, B, (t: T) => U>) =>
    (baz: Bazaar<P, A, B, T>): Bazaar<P, A, B, U> =>
    (app) =>
    (pab) =>
        app.apply(fn(app)(pab))(baz(app)(pab));

export interface BazaarHkt extends Hkt4 {
    readonly type: Bazaar<this["arg4"], this["arg3"], this["arg2"], this["arg1"]>;
}

export const proBizarre = <P>(pro: Profunctor<P>): Bizarre<P, Apply4Only<BazaarHkt, P>> => ({
    ...pro,
    bazaar: (app) => (g) => (f) => f(app)(g),
});

export const functor = <P, A, B>(): Functor<
    Apply2Only<Apply3Only<Apply4Only<BazaarHkt, P>, A>, B>
> => ({
    map,
});

export const applicative = <P, A, B>(): Applicative<
    Apply2Only<Apply3Only<Apply4Only<BazaarHkt, P>, A>, B>
> => ({
    pure,
    map,
    apply,
});

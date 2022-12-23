import { Lazy, force, defer as lazyDefer, map as lazyMap } from "./lazy.js";

import type { Functor1 } from "./type-class/functor.js";
import type { GetHktA1 } from "./hkt.js";
import { compose } from "./func.js";
import { map as tupleMap } from "./tuple.js";

declare const cofreeNominal: unique symbol;
export type CofreeHktKey = typeof cofreeNominal;
export type Cofree<F, A> = Lazy<[A, GetHktA1<F, Cofree<F, A>>]>;

export const defer: <F, A>(fn: () => [A, GetHktA1<F, Cofree<F, A>>]) => Cofree<F, A> = lazyDefer;

export const make =
    <A>(a: A) =>
    <F>(f: GetHktA1<F, Cofree<F, A>>): Cofree<F, A> =>
        lazyDefer(() => [a, f]);

export const head = <F, A>(c: Cofree<F, A>): A => force(c)[0];

export const tail = <F, A>(c: Cofree<F, A>): GetHktA1<F, Cofree<F, A>> => force(c)[1];

export const map =
    <F>(f: Functor1<F>) =>
    <A, B>(fn: (a: A) => B) =>
    (c: Cofree<F, A>): Cofree<F, B> =>
        lazyMap(([a, fa]: [A, GetHktA1<F, Cofree<F, A>>]): [B, GetHktA1<F, Cofree<F, B>>] => [
            fn(a),
            f.map(map(f)(fn))(fa),
        ])(c);
export const extract = head;

export const hoist =
    <F>(f: Functor1<F>) =>
    <G>(nat: <T>(a: GetHktA1<F, T>) => GetHktA1<G, T>) =>
    <A>(c: Cofree<F, A>): Cofree<G, A> =>
        lazyMap<[A, GetHktA1<F, Cofree<F, A>>], [A, GetHktA1<G, Cofree<G, A>>]>(
            tupleMap(
                compose<GetHktA1<F, Cofree<G, A>>, GetHktA1<G, Cofree<G, A>>>(nat)(
                    f.map(hoist(f)(nat)),
                ),
            ),
        )(c);

export const build =
    <F>(f: Functor1<F>) =>
    <S, A>(builder: (s: S) => [A, GetHktA1<F, S>]) =>
    (init: S): Cofree<F, A> =>
        lazyDefer(() => tupleMap(f.map(build(f)(builder)))(builder(init)));
export const unfold =
    <F>(f: Functor1<F>) =>
    <S, A>(fn: (s: S) => A) =>
    (unfolder: (s: S) => GetHktA1<F, S>): ((init: S) => Cofree<F, A>) =>
        build(f)((s) => [fn(s), unfolder(s)]);

// TODO: explore

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [cofreeNominal]: Cofree<A1, A2>;
    }
}

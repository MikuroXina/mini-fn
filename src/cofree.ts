import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.js";
import {
    defer as lazyDefer,
    eq as lazyEq,
    force,
    Lazy,
    map as lazyMap,
    ord as lazyOrd,
    partialEq as lazyPartialEq,
    partialOrd as lazyPartialOrd,
} from "./lazy.js";
import {
    eq as tupleEq,
    map as tupleMap,
    ord as tupleOrd,
    partialEq as tuplePartialEq,
    partialOrd as tuplePartialOrd,
    Tuple,
} from "./tuple.js";
import { Comonad, extend } from "./type-class/comonad.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import { kleisli, liftM, Monad } from "./type-class/monad.js";
import { fromCmp, Ord } from "./type-class/ord.js";
import { fromPartialEquality, PartialEq } from "./type-class/partial-eq.js";
import { fromPartialCmp, PartialOrd } from "./type-class/partial-ord.js";
import { mapM as mapMTraversable, Traversable } from "./type-class/traversable.js";

import { compose, pipe } from "./func.js";
import { mapOr, Option } from "./option.js";
import type { Ordering } from "./ordering.js";
import { appendToHead, empty, Seq, viewL } from "./seq.js";
import type { Functor } from "./type-class/functor.js";
import type { Representable } from "./type-class/representable.js";
import type { ComonadCofree } from "./cofree/comonad.js";

export interface CofreeHkt extends Hkt2 {
    readonly type: Cofree<this["arg2"], this["arg1"]>;
}

export type Cofree<F, A> = Lazy<Tuple<A, Get1<F, Cofree<F, A>>>>;

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => boolean = lazyPartialEq<
        Tuple<A, Get1<F, Cofree<F, A>>>
    >(tuplePartialEq({ equalityA, equalityB: equalityFA(fromPartialEquality(() => self)()) })).eq;
    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => boolean = lazyEq<
        Tuple<A, Get1<F, Cofree<F, A>>>
    >(tupleEq({ equalityA, equalityB: equalityFA(fromEquality(() => self)()) })).eq;
    return self;
};
export const eq = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Option<Ordering>) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => Option<Ordering> = lazyPartialOrd(
        tuplePartialOrd({
            ordA: orderA,
            ordB: orderFA(fromPartialCmp(() => self)()),
        }),
    ).partialCmp;
    return self;
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Ordering) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => Ordering = lazyOrd(
        tupleOrd({
            ordA: orderA,
            ordB: orderFA(fromCmp(() => self)()),
        }),
    ).cmp;
    return self;
};
export const ord = fromCmp(cmp);

export const defer: <F, A>(fn: () => [A, Get1<F, Cofree<F, A>>]) => Cofree<F, A> = lazyDefer;

export const make =
    <A>(a: A) =>
    <F>(f: Get1<F, Cofree<F, A>>): Cofree<F, A> =>
        lazyDefer(() => [a, f]);

export const head = <F, A>(c: Cofree<F, A>): A => force(c)[0];

export const tail = <F, A>(c: Cofree<F, A>): Get1<F, Cofree<F, A>> => force(c)[1];

export const unwrap = <F extends Hkt1, A>(cofree: Cofree<F, A>): Get1<F, Cofree<F, A>> =>
    force(cofree)[1];

export const map =
    <F extends Hkt1>(f: Functor<F>) =>
    <A, B>(fn: (a: A) => B) =>
    (c: Cofree<F, A>): Cofree<F, B> =>
        lazyMap(([a, fa]: readonly [A, Get1<F, Cofree<F, A>>]): [B, Get1<F, Cofree<F, B>>] => [
            fn(a),
            f.map(map(f)(fn))(fa),
        ])(c);
export const extract = head;

export const hoist =
    <F extends Hkt1>(f: Functor<F>) =>
    <G>(nat: <T>(a: Get1<F, T>) => Get1<G, T>) =>
    <A>(c: Cofree<F, A>): Cofree<G, A> =>
        lazyMap<Tuple<A, Get1<F, Cofree<F, A>>>, Tuple<A, Get1<G, Cofree<G, A>>>>(
            tupleMap(
                compose<Get1<F, Cofree<G, A>>, Get1<G, Cofree<G, A>>>(nat)(f.map(hoist(f)(nat))),
            ),
        )(c);

export const build =
    <F extends Hkt1>(f: Functor<F>) =>
    <S, A>(builder: (s: S) => [A, Get1<F, S>]) =>
    (init: S): Cofree<F, A> =>
        lazyDefer(() => tupleMap(f.map(build(f)(builder)))(builder(init)));

export const coiter =
    <F extends Hkt1>(functor: Functor<F>) =>
    <A>(psi: (a: A) => Get1<F, A>) =>
    (a: A): Cofree<F, A> =>
        make(a)(functor.map(coiter(functor)(psi))(psi(a)));

export const coiterW =
    <W extends Hkt1, F extends Hkt1>(comonad: Comonad<W>, functor: Functor<F>) =>
    <A>(psi: (wa: Get1<W, A>) => Get1<F, Get1<W, A>>) =>
    (a: Get1<W, A>): Cofree<F, A> =>
        make(comonad.extract(a))(functor.map(coiterW(comonad, functor)(psi))(psi(a)));

export const unfold =
    <F extends Hkt1>(f: Functor<F>) =>
    <S, A>(fn: (s: S) => A) =>
    (unfolder: (s: S) => Get1<F, S>): ((init: S) => Cofree<F, A>) =>
        build(f)((s) => [fn(s), unfolder(s)]);

export const unfoldM = <F extends Hkt1, M extends Hkt1>(
    traversable: Traversable<F>,
    monad: Monad<M>,
) => {
    const partial = <B, A>(
        f: (b: B) => Get1<M, Lazy<Tuple<A, Get1<F, B>>>>,
    ): ((b: B) => Get1<M, Cofree<F, A>>) =>
        kleisli(monad)(f)((tuple) => {
            const [x, t] = force(tuple);
            return liftM(monad)(make(x))(
                mapMTraversable<F, M, B, Cofree<F, A>>(traversable, monad)(partial(f))(t),
            );
        });
    return partial;
};

export const section =
    <F extends Hkt1>(comonad: Comonad<F>) =>
    <A>(as: Get1<F, A>): Cofree<F, A> =>
        make(comonad.extract(as))(extend(comonad)(section(comonad))(as));

export const functor = <F extends Hkt1>(f: Functor<F>): Functor<Apply2Only<CofreeHkt, F>> => ({
    map: map(f),
});

export const comonad = <F extends Hkt1>(f: Functor<F>): Comonad<Apply2Only<CofreeHkt, F>> => {
    const duplicate = <A>(w: Cofree<F, A>): Cofree<F, Cofree<F, A>> =>
        make(w)(f.map(duplicate)(unwrap(w)));
    return {
        map: map(f),
        duplicate,
        extract,
    };
};

export const comonadCofree = <F extends Hkt1>(
    f: Functor<F>,
): ComonadCofree<F, Apply2Only<CofreeHkt, F>> => ({
    ...comonad(f),
    functor: f,
    unwrap,
});

export const representable = <F extends Hkt1, Rep>(
    rep: Representable<F, Rep>,
): Representable<Apply2Only<CofreeHkt, F>, Seq<Rep>> => {
    const index =
        <A>(cofree: Cofree<F, A>) =>
        (key: Seq<Rep>): A => {
            const [a, as] = force(cofree);
            return mapOr(a)(([k, ks]: Tuple<Rep, Seq<Rep>>) => index(rep.index(as)(k))(ks))(
                viewL(key),
            );
        };
    const tabulate = <A>(f: (key: Seq<Rep>) => A): Cofree<F, A> =>
        make(f(empty))(rep.tabulate((k) => tabulate(pipe(appendToHead(k))(f))));
    return {
        map: map(rep),
        index,
        tabulate,
    };
};

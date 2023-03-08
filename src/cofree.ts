import type { ComonadCofree } from "./cofree/comonad.js";
import { compose, pipe } from "./func.js";
import type { Apply2Only, Get1, Hkt2 } from "./hkt.js";
import {
    Lazy,
    force,
    defer as lazyDefer,
    eq as lazyEq,
    map as lazyMap,
    ord as lazyOrd,
    partialEq as lazyPartialEq,
    partialOrd as lazyPartialOrd,
} from "./lazy.js";
import { Option, mapOr } from "./option.js";
import type { Ordering } from "./ordering.js";
import { Seq, appendToHead, empty, viewL } from "./seq.js";
import {
    Tuple,
    eq as tupleEq,
    map as tupleMap,
    ord as tupleOrd,
    partialEq as tuplePartialEq,
    partialOrd as tuplePartialOrd,
} from "./tuple.js";
import { Comonad, extend } from "./type-class/comonad.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";
import { Monad, kleisli, liftM } from "./type-class/monad.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";
import type { Representable } from "./type-class/representable.js";
import { Traversable, mapM as mapMTraversable } from "./type-class/traversable.js";

export interface CofreeHkt extends Hkt2 {
    readonly type: Cofree<this["arg2"], this["arg1"]>;
}

/**
 * Co-free functor, the dual of `Free`. It is isomorphic to the linked list of `A`.
 */
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

/**
 * Creates a new `Cofree` from the inner function.
 *
 * @param fn - The deferred function.
 * @returns The new instance.
 */
export const defer: <F, A>(fn: () => [A, Get1<F, Cofree<F, A>>]) => Cofree<F, A> = lazyDefer;

/**
 * Creates a new `Cofree` from the head and successor.
 *
 * @param a - The head element.
 * @param f - The successor, a `Cofree` mapped by `F`.
 * @returns The new instance.
 */
export const make =
    <A>(a: A) =>
    <F>(f: Get1<F, Cofree<F, A>>): Cofree<F, A> =>
        lazyDefer(() => [a, f]);

/**
 * Gets the head element.
 *
 * @param c - The instance of `Cofree`.
 * @returns The head element.
 */
export const head = <F, A>(c: Cofree<F, A>): A => force(c)[0];

/**
 * Gets the tail elements.
 *
 * @param c - The instance of `Cofree`.
 * @returns The tail elements contained by `F`.
 */
export const tail = <F, A>(c: Cofree<F, A>): Get1<F, Cofree<F, A>> => force(c)[1];

/**
 * Unwraps the instance.
 *
 * @param c - The instance of `Cofree`.
 * @returns The tail elements contained by the functor `F`.
 */
export const unwrap = <F, A>(cofree: Cofree<F, A>): Get1<F, Cofree<F, A>> => force(cofree)[1];

/**
 * Maps the function for `Cofree`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @param fn - The mapping function from `A` to `B`.
 * @returns - The lifted function from `Cofree<F, A>` to `Cofree<F, B>`.
 */
export const map =
    <F>(f: Functor<F>) =>
    <A, B>(fn: (a: A) => B): ((c: Cofree<F, A>) => Cofree<F, B>) =>
        lazyMap(([a, fa]: readonly [A, Get1<F, Cofree<F, A>>]): [B, Get1<F, Cofree<F, B>>] => [
            fn(a),
            f.map(map(f)(fn))(fa),
        ]);
/**
 * Extracts from the instance.
 *
 * @param c - The instance of `Cofree`.
 * @returns The head element.
 */
export const extract = head;

/**
 * Hoists the elements in `Cofree` by the natural transformation.
 *
 * @param f - The instance of `Functor` for `F`.
 * @param nat - The natural transformation.
 * @param c - The instance of `Cofree`.
 * @returns The hoisted instance.
 */
export const hoist =
    <F>(f: Functor<F>) =>
    <G>(nat: <T>(a: Get1<F, T>) => Get1<G, T>) =>
    <A>(c: Cofree<F, A>): Cofree<G, A> =>
        lazyMap<Tuple<A, Get1<F, Cofree<F, A>>>, Tuple<A, Get1<G, Cofree<G, A>>>>(
            tupleMap(
                compose<Get1<F, Cofree<G, A>>, Get1<G, Cofree<G, A>>>(nat)(f.map(hoist(f)(nat))),
            ),
        )(c);

/**
 * Build a new `Cofree` from `builder`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @param builder - The function constructs a tuple of head and successor.
 * @param init - The initial value for `builder`.
 * @returns The new instance.
 */
export const build =
    <F>(f: Functor<F>) =>
    <S, A>(builder: (s: S) => [A, Get1<F, S>]) =>
    (init: S): Cofree<F, A> =>
        lazyDefer(() => tupleMap(f.map(build(f)(builder)))(builder(init)));

/**
 * Generates a new `Cofree` from the co-iteration and seed.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param psi - The co-iteration, wraps the element by `F`.
 * @param a - The seed for `psi`.
 * @returns The new instance.
 */
export const coiter =
    <F>(functor: Functor<F>) =>
    <A>(psi: (a: A) => Get1<F, A>) =>
    (a: A): Cofree<F, A> =>
        make(a)(functor.map(coiter(functor)(psi))(psi(a)));

/**
 * Generates a new `Cofree` from the co-iteration and seed wrapped with comonad `W`.
 *
 * @param comonad - The instance of `Comonad` for `W`.
 * @param functor - The instance of `Functor` for `F`.
 * @param psi - The co-iteration, wraps the element by `F`.
 * @param a - The seed for `psi`.
 * @returns The new instance.
 */
export const coiterW =
    <W, F>(comonad: Comonad<W>, functor: Functor<F>) =>
    <A>(psi: (wa: Get1<W, A>) => Get1<F, Get1<W, A>>) =>
    (a: Get1<W, A>): Cofree<F, A> =>
        make(comonad.extract(a))(functor.map(coiterW(comonad, functor)(psi))(psi(a)));

/**
 * Unfolds into a `Cofree` from the seed.
 *
 * @param f - The instance of `Functor` for `F`.
 * @param unfolder - The function unfolds from `S` to `A`.
 * @param init - The seed for `unfolder`.
 * @returns The new instance.
 */
export const unfold =
    <F>(f: Functor<F>) =>
    <S, A>(unfolder: (s: S) => Tuple<A, Get1<F, S>>) =>
    (init: S): Cofree<F, A> => {
        const [headS, tailS] = unfolder(init);
        return make(headS)(f.map(unfold(f)(unfolder))(tailS));
    };

/**
 * Unfolds into a `Cofree` from the seed with monad `M`.
 *
 * @param traversable - The instance of `Traversable` for `F`.
 * @param monad - THe instance of `Monad` for `M`.
 * @param unfolder - The function unfolds from `S` to `A` with monad `M`.
 * @param init - The seed for `unfolder`.
 * @returns The new instance.
 */
export const unfoldM = <F, M>(traversable: Traversable<F>, monad: Monad<M>) => {
    const partial = <B, A>(
        unfolder: (b: B) => Get1<M, Lazy<Tuple<A, Get1<F, B>>>>,
    ): ((init: B) => Get1<M, Cofree<F, A>>) =>
        kleisli(monad)(unfolder)((tuple) => {
            const [x, t] = force(tuple);
            return liftM(monad)(make(x))(
                mapMTraversable<F, M, B, Cofree<F, A>>(traversable, monad)(partial(unfolder))(t),
            );
        });
    return partial;
};

/**
 * Creates a new `Cofree` from the comonad `F`.
 *
 * @param comonad - The instance of `Comonad` for `F`.
 * @param as - The seed used for construction.
 * @returns The new instance.
 */
export const section =
    <F>(comonad: Comonad<F>) =>
    <A>(as: Get1<F, A>): Cofree<F, A> =>
        make(comonad.extract(as))(extend(comonad)(section(comonad))(as));

/**
 * The instance of `Functor` for `Cofree<F, _>`, requires the `Functor` for `F`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @returns The instance of `Functor` for `Cofree<F, _>`.
 */
export const functor = <F>(f: Functor<F>): Functor<Apply2Only<CofreeHkt, F>> => ({
    map: map(f),
});

/**
 * The instance of `Comonad` for `Cofree<F, _>`, requires the `Functor` for `F`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @returns The instance of `Comonad` for `Cofree<F, _>`.
 */
export const comonad = <F>(f: Functor<F>): Comonad<Apply2Only<CofreeHkt, F>> => {
    const duplicate = <A>(w: Cofree<F, A>): Cofree<F, Cofree<F, A>> =>
        make(w)(f.map(duplicate)(unwrap(w)));
    return {
        map: map(f),
        duplicate,
        extract,
    };
};

/**
 * The instance of `ComonadCofree` for `Cofree<F, _>`, requires the `Functor` for `F`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @returns The instance of `ComonadCofree` for `Cofree<F, _>`.
 */
export const comonadCofree = <F>(f: Functor<F>): ComonadCofree<F, Apply2Only<CofreeHkt, F>> => ({
    ...comonad(f),
    functor: f,
    unwrap,
});

/**
 * The instance of `Representable` for `Cofree<F, _>`, requires the `Representable` for `F`.
 *
 * @param rep - The instance of `Representable` for `F`.
 * @returns The instance of `Representable` for `Cofree<F, _>`.
 */
export const representable = <F, Rep>(
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

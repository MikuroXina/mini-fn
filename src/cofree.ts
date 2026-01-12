import type { ComonadCofree } from "./cofree/comonad.js";
import { compose } from "./func.js";
import type { Apply2Only, Get1, Hkt2 } from "./hkt.js";
import {
    force,
    known,
    type Lazy,
    defer as lazyDefer,
    map as lazyMap,
    partialEq as lazyPartialEq,
    unzip,
} from "./lazy.js";
import { isNone, type Option, unwrap as optionUnwrap } from "./option.js";
import { equal, type Ordering } from "./ordering.js";
import type { Tuple } from "./tuple.js";
import { type Comonad, extend } from "./type-class/comonad.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";
import { kleisli, liftM, type Monad } from "./type-class/monad.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import {
    fromPartialEquality,
    type PartialEq,
    type PartialEqUnary,
} from "./type-class/partial-eq.js";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.js";
import {
    mapM as mapMTraversable,
    type Traversable,
} from "./type-class/traversable.js";

export interface CofreeHkt extends Hkt2 {
    readonly type: Cofree<this["arg2"], this["arg1"]>;
}

/**
 * Co-free functor, the dual of `Free`. It is isomorphic to the linked list of `A`.
 */
export type Cofree<F, A> = {
    /**
     * A current heading item of the list.
     */
    readonly current: Lazy<A>;
    /**
     * Rest items of the list.
     */
    readonly rest: Lazy<Get1<F, Cofree<F, A>>>;
};

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self = (l: Cofree<F, A>, r: Cofree<F, A>): boolean =>
        lazyPartialEq(equalityA).eq(l.current, r.current) &&
        lazyPartialEq(equalityFA(fromPartialEquality(() => self)())).eq(
            l.rest,
            r.rest,
        );
    return self;
};
export const partialEq: <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}) => PartialEq<Cofree<F, A>> = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self = (l: Cofree<F, A>, r: Cofree<F, A>): boolean =>
        lazyPartialEq(equalityA).eq(l.current, r.current) &&
        lazyPartialEq(equalityFA(fromEquality(() => self)())).eq(
            l.rest,
            r.rest,
        );
    return self;
};
export const eq: <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}) => Eq<Cofree<F, A>> = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Option<Ordering>) => {
    const self = (l: Cofree<F, A>, r: Cofree<F, A>): Option<Ordering> => {
        const res = orderA.partialCmp(force(l.current), force(r.current));
        if (isNone(res) || optionUnwrap(res) !== equal) {
            return res;
        }
        return orderFA(fromPartialCmp(() => self)()).partialCmp(
            force(l.rest),
            force(r.rest),
        );
    };
    return self;
};
export const partialOrd: <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}) => PartialOrd<Cofree<F, A>> = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Ordering) => {
    const self = (l: Cofree<F, A>, r: Cofree<F, A>): Ordering => {
        const res = orderA.cmp(force(l.current), force(r.current));
        if (res !== equal) {
            return res;
        }
        return orderFA(fromCmp(() => self)()).cmp(force(l.rest), force(r.rest));
    };
    return self;
};
export const ord: <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}) => Ord<Cofree<F, A>> = fromCmp(cmp);

export const partialEqUnary = <F>(
    eqUnary: PartialEqUnary<F>,
): PartialEqUnary<CofreeHkt> => ({
    liftEq: <Lhs, Rhs>(
        equality: (l: Lhs, r: Rhs) => boolean,
    ): ((l: Cofree<F, Lhs>, r: Cofree<F, Rhs>) => boolean) => {
        const self = (l: Cofree<F, Lhs>, r: Cofree<F, Rhs>): boolean =>
            lazyPartialEq({
                eq: equality,
            }).eq(l.current, r.current) &&
            lazyPartialEq({
                eq: eqUnary.liftEq(self),
            }).eq(l.rest, r.rest);
        return self;
    },
});

/**
 * Creates a new `Cofree` from the inner function.
 *
 * @param fn - The deferred function.
 * @returns The new instance.
 */
export const defer = <F, A>(
    fn: () => [A, Get1<F, Cofree<F, A>>],
): Cofree<F, A> => {
    const [current, rest] = unzip(lazyDefer(fn));
    return { current, rest };
};

/**
 * Creates a new `Cofree` from the head and successor.
 *
 * @param a - The head element.
 * @param f - The successor, a `Cofree` mapped by `F`.
 * @returns The new instance.
 */
export const make =
    <A>(a: A) =>
    <F>(f: Get1<F, Cofree<F, A>>): Cofree<F, A> => ({
        current: known(a),
        rest: known(f),
    });

/**
 * Gets the head element.
 *
 * @param c - The instance of `Cofree`.
 * @returns The head element.
 */
export const head = <F, A>(c: Cofree<F, A>): A => force(c.current);

/**
 * Gets the tail elements.
 *
 * @param c - The instance of `Cofree`.
 * @returns The tail elements contained by `F`.
 */
export const tail = <F, A>(c: Cofree<F, A>): Get1<F, Cofree<F, A>> =>
    force(c.rest);

/**
 * Unwraps the instance.
 *
 * @param c - The instance of `Cofree`.
 * @returns The tail elements contained by the functor `F`.
 */
export const unwrap = <F, A>(cofree: Cofree<F, A>): Get1<F, Cofree<F, A>> =>
    force(cofree.rest);

/**
 * Maps the function for `Cofree`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @param fn - The mapping function from `A` to `B`.
 * @returns - The lifted function from `Cofree<F, A>` to `Cofree<F, B>`.
 */
export const map =
    <F>(f: Functor<F>) =>
    <A, B>(fn: (a: A) => B) =>
    (c: Cofree<F, A>): Cofree<F, B> => ({
        current: lazyDefer(() => fn(force(c.current))),
        rest: lazyDefer(() => f.map(map(f)(fn))(force(c.rest))),
    });
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
    <G>(
        nat: <T>(a: Get1<F, T>) => Get1<G, T>,
    ): (<A>(c: Cofree<F, A>) => Cofree<G, A>) => {
        const self = <A>(c: Cofree<F, A>): Cofree<G, A> => ({
            current: c.current,
            rest: lazyMap<Get1<F, Cofree<F, A>>, Get1<G, Cofree<G, A>>>(
                compose<Get1<F, Cofree<G, A>>, Get1<G, Cofree<G, A>>>(nat)(
                    f.map(self),
                ),
            )(c.rest),
        });
        return self;
    };

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
    <S, A>(builder: (s: S) => [A, Get1<F, S>]): ((init: S) => Cofree<F, A>) => {
        const self = (init: S): Cofree<F, A> => {
            const [current, rest] = unzip(lazyDefer(() => builder(init)));
            return {
                current,
                rest: lazyMap(f.map(self))(rest),
            };
        };
        return self;
    };

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
        make(comonad.extract(a))(
            functor.map(coiterW(comonad, functor)(psi))(psi(a)),
        );

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
export const unfoldM = <F, M>(
    traversable: Traversable<F>,
    monad: Monad<M>,
): (<B, A>(
    unfolder: (b: B) => Get1<M, Lazy<Tuple<A, Get1<F, B>>>>,
) => (init: B) => Get1<M, Cofree<F, A>>) => {
    const partial = <B, A>(
        unfolder: (b: B) => Get1<M, Lazy<Tuple<A, Get1<F, B>>>>,
    ): ((init: B) => Get1<M, Cofree<F, A>>) =>
        kleisli(monad)(unfolder)((tuple) => {
            const [x, t] = force(tuple);
            return liftM(monad)(make(x))(
                mapMTraversable<F, M>(traversable, monad)(partial(unfolder))(t),
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
export const functor = <F>(
    f: Functor<F>,
): Functor<Apply2Only<CofreeHkt, F>> => ({
    map: map(f),
});

/**
 * The instance of `Comonad` for `Cofree<F, _>`, requires the `Functor` for `F`.
 *
 * @param f - The instance of `Functor` for `F`.
 * @returns The instance of `Comonad` for `Cofree<F, _>`.
 */
export const comonad = <F>(
    f: Functor<F>,
): Comonad<Apply2Only<CofreeHkt, F>> => {
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
export const comonadCofree = <F>(
    f: Functor<F>,
): ComonadCofree<F, Apply2Only<CofreeHkt, F>> => ({
    ...comonad(f),
    functor: f,
    unwrap,
});

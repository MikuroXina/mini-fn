import type { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import * as Option from "./option.ts";
import { greater, less, type Ordering } from "./ordering.ts";
import * as Result from "./result.ts";
import type { Tuple } from "./tuple.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";
import { kleisli, type Monad } from "./type-class/monad.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import type { Traversable } from "./type-class/traversable.ts";
import {
    functor as optionFunctor,
    isNone,
    monad as optionMonad,
    none,
    type OptionHkt,
    some,
    unwrap,
} from "./option.ts";
import { catT } from "./cat.ts";
import { assertEquals } from "std/assert/mod.ts";

const pureNominal = Symbol("FreePure");
const nodeNominal = Symbol("FreeNode");

/**
 * The leaf node of `Free`.
 */
export type Pure<A> = readonly [typeof pureNominal, A];
/**
 * The intermediate node of `Free`.
 */
export type Node<F, A> = readonly [typeof nodeNominal, Get1<F, Free<F, A>>];

/**
 * Creates the leaf node of `Free`.
 *
 * @param a - The value to be contained.
 * @returns The new node.
 */
export const pure = <A>(a: A): Pure<A> => [pureNominal, a];
/**
 * Create the intermediate node of `Free`.
 *
 * @param f - The value wrapped with `F` to be contained.
 * @returns The new node.
 */
export const node = <F, A>(
    f: Get1<F, Free<F, A>>,
): Node<F, A> => [nodeNominal, f];

export const isPure = <F, A>(free: Free<F, A>): free is Pure<A> =>
    free[0] === pureNominal;
export const isNode = <F, A>(free: Free<F, A>): free is Node<F, A> =>
    free[0] === nodeNominal;

/**
 * `Free` makes `Monad` instance from the functor `F`. It is left adjoint to some *forgetful* functor.
 */
export type Free<F, A> = Pure<A> | Node<F, A>;

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): boolean => {
        if (isPure(l) && isPure(r)) {
            return equalityA.eq(l[1], r[1]);
        }
        if (isNode(l) && isNode(r)) {
            return equalityFA(fromPartialEquality(() => self)()).eq(l[1], r[1]);
        }
        return false;
    };
    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): boolean => {
        if (isPure(l) && isPure(r)) {
            return equalityA.eq(l[1], r[1]);
        }
        if (isNode(l) && isNode(r)) {
            return equalityFA(fromEquality(() => self)()).eq(l[1], r[1]);
        }
        return false;
    };
    return self;
};
export const eq = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): Option.Option<Ordering> => {
        // considered that Pure is lesser than Node
        if (isPure(l)) {
            if (isPure(r)) {
                return orderA.partialCmp(l[1], r[1]);
            }
            return Option.some(less);
        }
        if (isPure(r)) {
            return Option.some(greater);
        }
        return orderFA(fromPartialCmp(() => self)()).partialCmp(l[1], r[1]);
    };
    return self;
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): Ordering => {
        // considered that Pure is lesser than Node
        if (isPure(l)) {
            if (isPure(r)) {
                return orderA.cmp(l[1], r[1]);
            }
            return less;
        }
        if (isPure(r)) {
            return greater;
        }
        return orderFA(fromCmp(() => self)()).cmp(l[1], r[1]);
    };
    return self;
};
export const ord = fromCmp(cmp);

/**
 * Reduces `Free` with the internal items.
 *
 * @param monad - The instance of `Monad` for `F`.
 * @param fr - The instance of `Free`.
 * @returns The reduction of `F`.
 */
export const retract =
    <F>(monad: Monad<F>) => <T>(fr: Free<F, T>): Get1<F, T> => {
        if (isPure(fr)) {
            return monad.pure(fr[1]);
        }
        return monad.flatMap(retract(monad))(fr[1]);
    };

Deno.test("retract", () => {
    const retractOption = retract(optionMonad);
    const m = monad<OptionHkt>(optionFunctor);
    const lift = liftF<OptionHkt>(optionMonad);
    const retracted = retractOption<string>(
        catT(m)(lift(some("hoge")))
            .then(lift(some("fuga")))
            .then(lift<string>(none()))
            .then(lift(some("foo"))).ctx,
    );
    assertEquals(isNone(retracted), true);
});

/**
 * Reduces `Free` with the internal items.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param fn - The function to be applied.
 * @param fr - The instance of `Free`.
 * @returns The reduction of `F`.
 */
export const iter =
    <F>(functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, T>) => T) =>
    (fr: Free<F, T>): T => {
        if (isPure(fr)) {
            return fr[1];
        }
        return fn(functor.map(iter(functor)(fn))(fr[1]));
    };

Deno.test("iter", () => {
    const iterOption = iter<OptionHkt>(optionMonad)(unwrap);
    const m = monad<OptionHkt>(optionFunctor);
    const lift = liftF<OptionHkt>(optionMonad);
    const iterated = iterOption<string>(
        catT(m)(lift(some("hoge")))
            .then(lift(some("fuga")))
            .then(lift(some("foo"))).ctx,
    );
    assertEquals(iterated, "foo");
});

/**
 * Reduces `Free` with the internal items.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param functor - The instance of `Functor` for `F`.
 * @param fn - The function to be applied on `A`.
 * @param fr - The instance of `Free`.
 * @returns The reduction of `F`.
 */
export const iterA =
    <A, F>(app: Applicative<A>, functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, Get1<A, T>>) => Get1<A, T>) =>
    (fr: Free<F, T>): Get1<A, T> => {
        if (isPure(fr)) {
            return app.pure(fr[1]);
        }
        return fn(functor.map(iterA(app, functor)(fn))(fr[1]));
    };
/**
 * Reduces `Free` with the internal items.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param functor - The instance of `Functor` for `F`.
 * @param fn - The function to be applied on `M`.
 * @param fr - The instance of `Free`.
 * @returns The reduction of `F`.
 */
export const iterM =
    <M, F>(monad: Monad<M>, functor: Functor<F>) =>
    <A>(fn: (fma: Get1<F, Get1<M, A>>) => Get1<M, A>) =>
    (fr: Free<F, A>): Get1<M, A> => {
        if (isPure(fr)) {
            return monad.pure(fr[1]);
        }
        return fn(functor.map(iterM(monad, functor)(fn))(fr[1]));
    };

/**
 * Hoists the items of `Free` by the natural transformation.
 *
 * @param functor - The instance of `Functor` for `G`.
 * @param nat - The natural transformation.
 * @returns The lifted transformation of `Free`.
 */
export const hoistFree =
    <G>(functor: Functor<G>) =>
    <F>(nat: <T>(f: Get1<F, T>) => Get1<G, T>) =>
    <T>(fr: Free<F, T>): Free<G, T> => {
        if (isPure(fr)) {
            return fr;
        }
        return node(functor.map(hoistFree(functor)(nat))(nat(fr[1])));
    };

/**
 * Make a product from two `Free`s.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param a - The left-side of a product.
 * @param b - The right-side of a product.
 * @returns The product of two `Free`s.
 */
export const productT =
    <F>(app: Applicative<F>) =>
    <A>(a: Free<F, A>) =>
    <B>(b: Free<F, B>): Free<F, Tuple<A, B>> => {
        if (isNode(a)) {
            const mapped = app.map(productT(app))(a[1]);
            const applied = app.apply<Free<F, B>, Free<F, Tuple<A, B>>>(mapped)(
                app.pure(b),
            );
            return node(applied);
        }
        if (isNode(b)) {
            return node(app.map(productT(app)(a))(b[1]));
        }
        return pure<[A, B]>([a[1], b[1]]);
    };

/**
 * Folds all the values in `Free` with monad `M`.
 *
 * @param m - The instance of `Monad` for `M`.
 * @param fn - The folder for `M`.
 * @param fr - The instance of `Free`.
 * @returns The folded value contained by `M`.
 */
export const foldFree =
    <M>(m: Monad<M>) =>
    <F>(fn: <T>(f: Get1<F, T>) => Get1<M, T>) =>
    <T>(fr: Free<F, T>): Get1<M, T> => {
        if (isPure(fr)) {
            return m.pure(fr[1]);
        }
        return m.flatMap(foldFree(m)(fn))(fn(fr[1]));
    };

/**
 * Lifts up the functor item into a `Free`.
 *
 * @param func - The instance of `Functor` for `F`.
 * @param ft - The instance of `F` to be lifted.
 * @returns The new `Free`.
 */
export const liftF = <F>(func: Functor<F>) => <T>(ft: Get1<F, T>): Free<F, T> =>
    node(func.map<T, Free<F, T>>(pure)(ft));

/**
 * Maps the function on `Free`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param f - The function to be mapped.
 * @returns The mapped function between `Free`s.
 */
export const mapT =
    <F>(functor: Functor<F>) =>
    <T, U>(f: (t: T) => U) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return pure(f(t[1]));
        }
        return node(functor.map(mapT(functor)(f))(t[1]));
    };

/**
 * Maps and flatten the function on `Free`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param mf - The function to be mapped and flattened.
 * @returns The mapped function between `Free`s.
 */
export const flatMapT =
    <F>(functor: Functor<F>) =>
    <T, U>(mf: (t: T) => Free<F, U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return mf(t[1]);
        }
        return node(functor.map(flatMapT(functor)(mf))(t[1]));
    };

/**
 * Applies the function on `Free`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param mf - The function wrapped with `Free`.
 * @param t - The instance of `Free` to be applied.
 * @returns The applied instance.
 */
export const applyT =
    <F>(functor: Functor<F>) =>
    <T, U>(mf: Free<F, (t: T) => U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            if (isPure(mf)) {
                return pure(mf[1](t[1]));
            }
            const applied = (rest: Free<F, (t: T) => U>) =>
                applyT(functor)(rest)(t);
            return node(functor.map(applied)(mf[1]));
        }
        return node(functor.map(applyT(functor)(mf))(t[1]));
    };

/**
 * Cuts off the tree of computations at n-th index. If `n` is zero or less, the empty operation will be returned.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param n - The depths to cut.
 * @param fr - The `Free` instance as a tree of computations.
 * @returns The cut off instance.
 */
export const cutoff =
    <F>(functor: Functor<F>) =>
    (n: number) =>
    <T>(fr: Free<F, T>): Free<F, Option.Option<T>> => {
        if (n <= 0) {
            return pure(Option.none());
        }
        if (isNode(fr)) {
            return node(functor.map(cutoff(functor)(n - 1))(fr[1]));
        }
        const some = (x: T): Option.Option<T> => Option.some(x);
        return mapT(functor)(some)(fr);
    };

/**
 * Unfolds into a `Free` from `seed`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param fn - The folder which returns `Result` as an accumulated result.
 * @param seed - The seed of unfolding.
 * @returns The new instance as an unfolded tree.
 */
export const unfold =
    <F>(functor: Functor<F>) =>
    <A, B>(fn: (b: B) => Result.Result<A, Get1<F, B>>) =>
    (seed: B): Free<F, A> =>
        Result.either((a: A): Free<F, A> => pure(a))((fb: Get1<F, B>) =>
            node(functor.map(unfold(functor)(fn))(fb))
        )(fn(seed));
/**
 * Unfolds into a `Free` from `seed` with monad `M`.
 *
 * @param traversable - The instance of `Traversable` for `F`.
 * @param monad - The instance of `Monad` for `M`.
 * @param fn - The folder which returns `Result` as an accumulated result.
 * @param seed - The seed of unfolding.
 * @returns The new instance as an unfolded tree.
 */
export const unfoldM =
    <F, M>(traversable: Traversable<F>, monad: Monad<M>) =>
    <A, B>(
        f: (b: B) => Get1<M, Result.Result<A, Get1<F, B>>>,
    ): (b: B) => Get1<M, Free<F, A>> => {
        return kleisli(monad)(f)(
            Result.either((a: A) => monad.pure(pure(a) as Free<F, A>))((fb) =>
                monad.map((ffa: Get1<F, Free<F, A>>) =>
                    node(ffa) as Free<F, A>
                )(
                    traversable.traverse(monad)(unfoldM(traversable, monad)(f))(
                        fb,
                    ),
                )
            ),
        );
    };

export interface FreeHkt extends Hkt2 {
    readonly type: Free<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Free<F, _>` from a functor `F`.
 */
export const functor = <F>(f: Functor<F>): Monad<Apply2Only<FreeHkt, F>> => ({
    map: mapT(f),
    pure,
    flatMap: <T1, U1>(
        fn: (t: T1) => Free<F, U1>,
    ): (free: Free<F, T1>) => Free<F, U1> => {
        const self = (free: Free<F, T1>): Free<F, U1> =>
            isPure(free)
                ? (fn(free[1]) as Free<F, U1>)
                : node(f.map(self)(free[1]));
        return self;
    },
    apply: applyT(f),
});

/**
 * The instance of `Monad` for `Free<F, _>` from a functor `F`.
 */
export const monad = <F>(f: Functor<F>): Monad<Apply2Only<FreeHkt, F>> => ({
    pure,
    map: mapT(f),
    flatMap: flatMapT(f),
    apply: applyT(f),
});

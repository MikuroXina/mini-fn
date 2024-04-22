/**
 * This package provides a `Free` monad which makes any kind `F` into a `Monad` instance. It is useful for creating your own domain-specific-language (DSL) and its interpreter.
 *
 * @packageDocumentation
 */

import {
    type ControlFlow,
    isBreak,
    newBreak,
    newContinue,
} from "./control-flow.ts";
import * as Coyoneda from "./coyoneda.ts";
import type { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import * as Option from "./option.ts";
import type { Ordering } from "./ordering.ts";
import * as Result from "./result.ts";
import type { Tuple } from "./tuple.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import {
    type Foldable,
    foldL as foldableFoldL,
    foldMap as foldableFoldMap,
} from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { MonadRec } from "./type-class/monad-rec.ts";
import { kleisli, type Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import type { Nt } from "./type-class/nt.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import type { Pure } from "./type-class/pure.ts";
import type { Traversable } from "./type-class/traversable.ts";

const returnNominal = Symbol("FreePure");
/**
 * `Return` denotes a terminal symbol of your language.
 */
export type Return<T> = readonly [typeof returnNominal, T];
/**
 * Creates a new `Return` from the internal item.
 */
export const newReturn = <T>(item: T): Return<T> => [returnNominal, item];
export const isReturn = <F, T>(fr: Free<F, T>): fr is Return<T> =>
    fr[0] === returnNominal;

const bindNominal = Symbol("FreeBind");
/**
 * `Bind` denotes a non-terminal symbol of your language `F`.
 */
export type Bind<F, T> = readonly [
    typeof bindNominal,
    Coyoneda.Coyoneda<F, Free<F, T>>,
];
/**
 * Creates a new `Bind` from the internal item.
 */
export const newBind = <F, T>(
    item: Coyoneda.Coyoneda<F, Free<F, T>>,
): Bind<F, T> => [bindNominal, item];
export const isBind = <F, T>(fr: Free<F, T>): fr is Bind<F, T> =>
    fr[0] === bindNominal;

/**
 * A `Free` monad, which represents a list of tokens of your domain-specific-language (DSL).
 *
 * `F` can be any kind and not required a `Functor` instance, but it may be needed when to interpret by functions such as `runFree`.
 */
export type Free<F, T> = Return<T> | Bind<F, T>;

/**
 * Wraps a `Free` item on `F` into a new `Free`.
 */
export const wrap = <F, T>(
    f: Get1<F, Free<F, T>>,
): Free<F, T> => newBind(Coyoneda.lift(f));

/**
 * It is equivalent to `Free.wrap(p.pure(f))`.
 */
export const suspendF = <F>(p: Pure<F>) => <T>(f: Free<F, T>): Free<F, T> =>
    wrap(p.pure(f));

/**
 * Substitute the kind `F` of `Free<F, _>` with `G` by a natural transformation from `F` to `G`.
 *
 * @param nat - A natural transformation from `F` to `G`.
 * @param f - A list of tokens to be mapped.
 * @returns The mapped new `Free`.
 */
export const substFree = <F, G>(
    nat: Nt<F, Apply2Only<FreeHkt, G>>,
): <T>(f: Free<F, T>) => Free<G, T> => {
    const go = <T>(f: Free<F, T>): Free<G, T> =>
        isReturn(f) ? pure(f[1]) : Coyoneda.unCoyoneda(
            <X>(mapper: (shape: X) => Free<F, T>) => (image: Get1<F, X>) =>
                flatMap((x: X) => go(mapper(x)))(nat.nt(image)),
        )(f[1]);
    return go;
};

/**
 * Executes and interprets tokens of your language `F` by `runner`.
 *
 * @param functor - A `Functor` instance for `F`.
 * @param runner - A function that interprets tokens on `F` as `Get1<F, Free<F, T>>` and folds into a new `Free<F, T>`.
 * @param fr - A list of tokens to be run.
 * @returns The execution result.
 */
export const runFree =
    <F>(functor: Functor<F>) =>
    <T>(runner: (token: Get1<F, Free<F, T>>) => Free<F, T>) =>
    (fr: Free<F, T>): T => {
        while (isBind(fr)) {
            fr = runner(Coyoneda.lower(functor)(fr[1]));
        }
        return fr[1];
    };

/**
 * Executes and interprets tokens of your language `F` by `runner` on environment `M`.
 *
 * @param functor - A `Functor` instance for `F`.
 * @param m - A `MonadRec` instance for `M`.
 * @param runner - A function that interprets tokens on `F` as `Get1<F, Free<F, T>>` and folds into a new `Free<F, T>` on `M`.
 * @param fr - A list of tokens to be run.
 * @returns The execution result on `M`.
 */
export const runFreeM = <F>(functor: Functor<F>) =>
<M>(m: MonadRec<M>) =>
<T>(
    runner: (token: Get1<F, Free<F, T>>) => Get1<M, Free<F, T>>,
): (fr: Free<F, T>) => Get1<M, T> =>
    m.tailRecM(
        (fr: Free<F, T>): Get1<M, ControlFlow<T, Free<F, T>>> => {
            if (isReturn(fr)) {
                return m.map(newBreak)(m.pure(fr[1]));
            }
            return m.map(newContinue)(
                runner(Coyoneda.lower(functor)(fr[1])),
            );
        },
    );

/**
 * Converts a `Free` into a function of continuation passing style.
 *
 * @param onBind - A function called on `Bind` value.
 * @param onReturn - A function called on `Return` value.
 * @param data - A `Free` item to be converted.
 * @returns The continuation result of given functions.
 */
export const intoCont = <F, T, R>(
    onBind: <S>(next: (s: S) => Free<F, T>) => (data: Get1<F, S>) => R,
) =>
(onReturn: (t: T) => R) =>
(data: Free<F, T>): R => {
    return isReturn(data)
        ? onReturn(data[1])
        : Coyoneda.unCoyoneda(onBind)(data[1]);
};
/**
 * Converts a `Free` into a `Result` value. A `Return` will be mapped to an `Err` and a `Bind` will be mapped to an `Ok`.
 *
 * @param functor - A `Functor` instance for `F`.
 * @param f - A `Free` item to be converted.
 * @returns The mapped result value.
 */
export const intoResult =
    <F>(functor: Functor<F>) =>
    <T>(f: Free<F, T>): Result.Result<T, Get1<F, Free<F, T>>> =>
        intoCont(
            <S>(
                next: (t: S) => Free<F, T>,
            ) =>
            (data: Get1<F, S>): Result.Result<T, Get1<F, Free<F, T>>> =>
                Result.ok(functor.map(next)(data)),
        )(Result.err)(f);

/**
 * Wraps a value of `T` into a new `Free<F, T>`. It is equivalent to `newReturn`.
 */
export const pure = <F, T>(item: T): Free<F, T> => newReturn(item);

export const map = <T, U>(fn: (t: T) => U) => <F>(f: Free<F, T>): Free<F, U> =>
    flatMap((t: T): Free<F, U> => pure(fn(t)))(f);

export const apply =
    <F, T, U>(fn: Free<F, (t: T) => U>) => (f: Free<F, T>): Free<F, U> =>
        flatMap((fn: (t: T) => U) => map(fn)(f))(fn);

export const flatMap = <F, T, U>(
    fn: (t: T) => Free<F, U>,
): (f: Free<F, T>) => Free<F, U> => {
    const go = (f: Free<F, T>): Free<F, U> => {
        if (isReturn(f)) {
            return fn(f[1]);
        }
        return newBind(Coyoneda.map(go)(f[1]));
    };
    return go;
};

export const flatten = <F, T>(nested: Free<F, Free<F, T>>): Free<F, T> =>
    flatMap((x: Free<F, T>) => x)(nested);

export const tailRecM =
    <F, B, C>(stepper: (state: C) => Free<F, ControlFlow<B, C>>) =>
    (state: C): Free<F, B> =>
        flatMap((flow: ControlFlow<B, C>): Free<F, B> =>
            isBreak(flow) ? pure(flow[1]) : tailRecM(stepper)(flow[1])
        )(stepper(state));

export const foldR = <F>(f: Foldable<F> & Functor<F>) =>
<A, B>(
    folder: (next: A) => (acc: B) => B,
): (init: B) => (data: Free<F, A>) => B => {
    const go = (init: B) => (data: Free<F, A>): B =>
        Result.mapOrElse((ok: A) => folder(ok)(init))(
            f.foldR((next: Free<F, A>) => (acc: B) => go(acc)(next))(init),
        )(intoResult(f)(data));
    return go;
};

export const foldL = <F>(f: Foldable<F> & Functor<F>) =>
<A, B>(
    folder: (acc: B) => (next: A) => B,
): (init: B) => (data: Free<F, A>) => B => {
    const go = (init: B) => (data: Free<F, A>): B =>
        Result.mapOrElse(folder(init))(
            foldableFoldL(f)((acc: B) => (next: Free<F, A>) => go(acc)(next))(
                init,
            ),
        )(intoResult(f)(data));
    return go;
};

export const foldMap =
    <F>(f: Foldable<F> & Functor<F>) =>
    <M>(monoid: Monoid<M>) =>
    <T>(mapper: (t: T) => M): (data: Free<F, T>) => M => {
        const go = (data: Free<F, T>): M =>
            Result.mapOrElse(mapper)(
                foldableFoldMap<F, Free<F, T>, M>(f, monoid)(go),
            )(intoResult(f)(data));
        return go;
    };

export const traverse = <F>(
    app: Traversable<F> & Applicative<F>,
) =>
<A, B>(
    visitor: (a: A) => Get1<F, B>,
): (data: Free<F, A>) => Get1<F, Free<F, B>> => {
    const go = (data: Free<F, A>): Get1<F, Free<F, B>> =>
        Result.mapOrElse((a: A): Get1<F, Free<F, B>> =>
            app.map(pure)(visitor(a))
        )((fa: Get1<F, Free<F, A>>) =>
            app.map((a: Get1<F, Free<F, B>>) => flatten(liftF(a)))(
                app.traverse(app)(go)(fa),
            )
        )(intoResult(app)(data));
    return go;
};

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
    functor,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
    functor: Functor<F>;
}) =>
(l: Free<F, A>, r: Free<F, A>): boolean =>
    Result.partialEquality({
        equalityE: equalityA,
        equalityT: equalityFA<Free<F, A>>(
            partialEq({ equalityA, equalityFA, functor }),
        ),
    })(intoResult(functor)(l), intoResult(functor)(r));
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
    functor,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
    functor: Functor<F>;
}) =>
(l: Free<F, A>, r: Free<F, A>): boolean =>
    Result.equality({
        equalityE: equalityA,
        equalityT: equalityFA<Free<F, A>>(
            eq({ equalityA, equalityFA, functor }),
        ),
    })(intoResult(functor)(l), intoResult(functor)(r));
export const eq = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
    functor,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
    functor: Functor<F>;
}) =>
(l: Free<F, A>, r: Free<F, A>): Option.Option<Ordering> =>
    Result.partialCmp({
        orderE: orderA,
        orderT: orderFA<Free<F, A>>(
            partialOrd({ orderA, orderFA, functor }),
        ),
    })(intoResult(functor)(l), intoResult(functor)(r));
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
    functor,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
    functor: Functor<F>;
}) =>
(l: Free<F, A>, r: Free<F, A>): Ordering =>
    Result.cmp({
        orderE: orderA,
        orderT: orderFA<Free<F, A>>(
            ord({ orderA, orderFA, functor }),
        ),
    })(intoResult(functor)(l), intoResult(functor)(r));
export const ord = fromCmp(cmp);

/**
 * Reduces `Free` with the internal items.
 *
 * @param monad - A `Monad` instance for `F`.
 * @param fr - The `Free` item.
 * @returns The reduction of `F`.
 */
export const retract =
    <F>(monad: Monad<F>) => <T>(fr: Free<F, T>): Get1<F, T> => {
        if (isReturn(fr)) {
            return monad.pure(fr[1]);
        }
        return monad.flatMap(retract(monad))(Coyoneda.lower(monad)(fr[1]));
    };

/**
 * Reduces `Free` with the internal items.
 *
 * @param functor - A `Functor` instance for `F`.
 * @param fn - A function to be applied.
 * @param fr - A `Free` instance.
 * @returns The reduction of `F`.
 */
export const iter =
    <F>(functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, T>) => T) =>
    (fr: Free<F, T>): T => {
        if (isReturn(fr)) {
            return fr[1];
        }
        return fn(
            functor.map(iter(functor)(fn))(Coyoneda.lower(functor)(fr[1])),
        );
    };

/**
 * Reduces `Free` with the internal items.
 *
 * @param app - An `Applicative` instance for `F`.
 * @param functor - A `Functor` instance for `F`.
 * @param fn - A function to be applied on `A`.
 * @param fr - A `Free` instance.
 * @returns The reduction of `F`.
 */
export const iterA =
    <A, F>(app: Applicative<A>, functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, Get1<A, T>>) => Get1<A, T>) =>
    (fr: Free<F, T>): Get1<A, T> => {
        if (isReturn(fr)) {
            return app.pure(fr[1]);
        }
        return fn(
            functor.map(iterA(app, functor)(fn))(
                Coyoneda.lower(functor)(fr[1]),
            ),
        );
    };
/**
 * Reduces `Free` with the internal items.
 *
 * @param monad - A `Monad` instance for `M`.
 * @param functor - A `Functor` instance for `F`.
 * @param fn - A function to be applied on `M`.
 * @param fr - A `Free` instance.
 * @returns The reduction of `F`.
 */
export const iterM =
    <M, F>(monad: Monad<M>, functor: Functor<F>) =>
    <A>(fn: (fma: Get1<F, Get1<M, A>>) => Get1<M, A>) =>
    (fr: Free<F, A>): Get1<M, A> => {
        if (isReturn(fr)) {
            return monad.pure(fr[1]);
        }
        return fn(
            functor.map(iterM(monad, functor)(fn))(
                Coyoneda.lower(functor)(fr[1]),
            ),
        );
    };

/**
 * Hoists the items of `Free` by a natural transformation `nat`.
 *
 * @param nat - A natural transformation from `F` to `G`.
 * @returns The lifted transformation of `Free`.
 */
export const hoistFree = <F, G>(
    nat: Nt<F, G>,
): <T>(fr: Free<F, T>) => Free<G, T> =>
    substFree({ nt: <T>(ft: Get1<F, T>): Free<G, T> => liftF(nat.nt(ft)) });

/**
 * Makes a product from two `Free`s.
 *
 * @param app - An `Applicative` instance for `F`.
 * @param a - A left-side of a product.
 * @param b - A right-side of a product.
 * @returns The product of two `Free`s.
 */
export const productT =
    <F, A>(a: Free<F, A>) => <B>(b: Free<F, B>): Free<F, Tuple<A, B>> =>
        flatMap((a: A) => map((b: B): Tuple<A, B> => [a, b])(b))(a);

/**
 * Folds all the values in `Free<F, _>` with monad `M`.
 *
 * @param m - A `Monad` instance for `M`.
 * @param nat - A natural transformation from `F` to `M`.
 * @param ft - A `Free` instance.
 * @returns The folded value contained by `M`.
 */
export const foldFree = <M>(m: MonadRec<M>) =>
<F>(
    nat: Nt<F, M>,
): Nt<Apply2Only<FreeHkt, F>, M> => ({
    nt: <T>(ft: Free<F, T>): Get1<M, T> =>
        m.tailRecM<T, Free<F, T>>(
            (f: Free<F, T>): Get1<M, ControlFlow<T, Free<F, T>>> => {
                if (isReturn(f)) {
                    return m.map(newBreak<T>)(m.pure(f[1]));
                }
                return Coyoneda.lower(m)(
                    Coyoneda.hoist(nat.nt)(
                        Coyoneda.map(newContinue<Free<F, T>>)(f[1]),
                    ),
                );
            },
        )(ft),
});

/**
 * Lifts up the item into a `Free`.
 *
 * @param ft - A `F` instance to be lifted.
 * @returns The new `Free`.
 */
export const liftF = <F, T>(
    ft: Get1<F, T>,
): Free<F, T> => newBind(Coyoneda.coyoneda(pure<F, T>)(ft));

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
        if (isBind(fr)) {
            return wrap(
                functor.map(cutoff(functor)(n - 1))(
                    Coyoneda.lower(functor)(fr[1]),
                ),
            );
        }
        return map(Option.some<T>)(fr);
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
            wrap(functor.map(unfold(functor)(fn))(fb))
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
    ): (b: B) => Get1<M, Free<F, A>> =>
        kleisli(monad)(f)(
            Result.either((a: A): Get1<M, Free<F, A>> => monad.pure(pure(a)))((
                fb,
            ) => monad.map(wrap)(
                traversable.traverse(monad)(unfoldM(traversable, monad)(f))(
                    fb,
                ),
            )),
        );

export interface FreeHkt extends Hkt2 {
    readonly type: Free<this["arg2"], this["arg1"]>;
}

export const applicative = <F>(): Applicative<Apply2Only<FreeHkt, F>> => ({
    map,
    pure,
    apply,
});

/**
 * The instance of `Functor` for `Free<F, _>` from a functor `F`.
 */
export const functor = <F>(): Monad<Apply2Only<FreeHkt, F>> => ({
    map,
    pure,
    apply,
    flatMap,
});

/**
 * The instance of `Monad` for `Free<F, _>` from a functor `F`.
 */
export const monad = <F>(): Monad<Apply2Only<FreeHkt, F>> => ({
    pure,
    map,
    apply,
    flatMap,
});

export const monadRec = <F>(): MonadRec<Apply2Only<FreeHkt, F>> => ({
    pure,
    map,
    apply,
    flatMap,
    tailRecM,
});

import {
    append,
    appendToTail,
    type CatList,
    empty,
    headAndRest,
} from "./cat-list.ts";
import {
    type ControlFlow,
    isBreak,
    newBreak,
    newContinue,
} from "./control-flow.ts";
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

const bindNominal = Symbol("FreeBind");
export type Bind<F, T, S> = readonly [
    typeof bindNominal,
    Get1<F, S>,
    (t: S) => Free<F, T>,
];

const returnNominal = Symbol("FreeReturn");
export type Return<T> = readonly [typeof returnNominal, T];

export type FreeView<F, T, S> = Return<T> | Bind<F, T, S>;
export const isBind = <F, T, S>(
    view: FreeView<F, T, S>,
): view is Bind<F, T, S> => view[0] === bindNominal;
export const isReturn = <F, T, S>(view: FreeView<F, T, S>): view is Return<T> =>
    view[0] === returnNominal;

export type ExprF<F, T, S> = (state: S) => Free<F, T>;
export type Free<F, T> = <S>() => readonly [
    view: FreeView<F, T, S>,
    list: CatList<ExprF<F, T, S>>,
];

export const fromView =
    <F, T>(view: <S>() => FreeView<F, T, S>): Free<F, T> =>
    <S>(): readonly [
        view: FreeView<F, T, S>,
        list: CatList<ExprF<F, T, S>>,
    ] => [view<S>(), empty()];

export const toView = <F, T>(f: Free<F, T>) => <S>(): FreeView<F, T, S> => {
    const concatF =
        (f: Free<F, T>) =>
        (right: CatList<ExprF<F, T, S>>): Free<F, T> =>
        <S>(): readonly [
            view: FreeView<F, T, S>,
            list: CatList<ExprF<F, T, S>>,
        ] => {
            const [view, left] = f<S>();
            return [
                view,
                append(left)(right as unknown as CatList<ExprF<F, T, S>>),
            ];
        };

    const [view, list] = f<S>();
    if (isBind(view)) {
        return [bindNominal, view[1], (a) => concatF(view[2](a))(list)];
    }
    return Option.mapOrElse<FreeView<F, T, S>>(
        () => [returnNominal, view[1]],
    )((
        [head, rest]: readonly [ExprF<F, T, S>, CatList<ExprF<F, T, S>>],
    ): FreeView<F, T, S> =>
        toView(concatF(head(view[1] as unknown as S))(rest))<S>()
    )(
        headAndRest(list),
    );
};

export const wrap = <F, T>(f: Get1<F, Free<F, T>>): Free<F, T> =>
    fromView(<S>(): Bind<
        F,
        T,
        S
    > => [bindNominal, f as Get1<F, S>, (t) => t as Free<F, T>]);

export const suspendF = <F>(p: Pure<F>) => <T>(f: Free<F, T>): Free<F, T> =>
    wrap(p.pure(f));

export const substFree = <F, G>(
    nat: Nt<F, Apply2Only<FreeHkt, G>>,
): <T>(f: Free<F, T>) => Free<G, T> => {
    const go = <T>(f: Free<F, T>): Free<G, T> => {
        const view = toView(f)<T>();
        return isReturn(view)
            ? pure(view[1])
            : flatMap(go)(map(view[2])(nat.nt(view[1])));
    };
    return go;
};

export const runFree = <F>(functor: Functor<F>) =>
<T>(
    runner: (token: Get1<F, Free<F, T>>) => Free<F, T>,
): (fr: Free<F, T>) => T => {
    const go = (fr: Free<F, T>): T => {
        const view = toView(fr)<F>();
        if (isReturn(view)) {
            return view[1];
        }
        return go(runner(functor.map(view[2])(view[1])));
    };
    return go;
};

export const runFreeM = <F>(functor: Functor<F>) =>
<M>(m: MonadRec<M>) =>
<T>(
    runner: (token: Get1<F, Free<F, T>>) => Get1<M, Free<F, T>>,
): (fr: Free<F, T>) => Get1<M, T> =>
    m.tailRecM(
        (fr: Free<F, T>): Get1<M, ControlFlow<T, Free<F, T>>> => {
            const view = toView(fr)<M>();
            if (isReturn(view)) {
                return m.map(newBreak)(m.pure(view[1]));
            }
            return m.map(newContinue)(
                runner(functor.map(view[2])(view[1])),
            );
        },
    );

export const resumeCont = <F, T, R>(
    onBind: <S>(data: Get1<F, S>) => (next: (s: S) => Free<F, T>) => R,
) =>
(onReturn: (t: T) => R) =>
(data: Free<F, T>): R => {
    const view = toView(data)<R>();
    return isReturn(view) ? onReturn(view[1]) : onBind(view[1])(view[2]);
};
export const resume =
    <F>(functor: Functor<F>) =>
    <T>(f: Free<F, T>): Result.Result<Get1<F, Free<F, T>>, T> =>
        resumeCont(
            <S>(data: Get1<F, S>) =>
            (
                next: (t: S) => Free<F, T>,
            ): Result.Result<Get1<F, Free<F, T>>, T> =>
                Result.err(functor.map(next)(data)),
        )(Result.ok)(f);

export const pure = <F, T>(item: T): Free<F, T> =>
    fromView(() => [returnNominal, item]);

export const map = <T, U>(fn: (t: T) => U) => <F>(f: Free<F, T>): Free<F, U> =>
    flatMap((t: T) => pure(fn(t)))(f);

export const apply =
    <F, T, U>(fn: Free<F, (t: T) => U>) => (f: Free<F, T>): Free<F, U> =>
        flatMap((fn: (t: T) => U) => map(fn)(f))(fn);

export const flatMap =
    <F, T, U>(fn: (t: T) => Free<F, U>) =>
    (f: Free<F, T>): Free<F, U> =>
    <S>() => {
        const [value, list] = f<S>();
        return [
            value as unknown as FreeView<F, U, S>,
            appendToTail(list)(fn as unknown as ExprF<F, U, S>),
        ];
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
        Result.mapOrElse(
            f.foldR((next: Free<F, A>) => (acc: B) => go(acc)(next))(init),
        )((ok: A) => folder(ok)(init))(resume(f)(data));
    return go;
};

export const foldL = <F>(f: Foldable<F> & Functor<F>) =>
<A, B>(
    folder: (acc: B) => (next: A) => B,
): (init: B) => (data: Free<F, A>) => B => {
    const go = (init: B) => (data: Free<F, A>): B =>
        Result.mapOrElse(
            foldableFoldL(f)((acc: B) => (next: Free<F, A>) => go(acc)(next))(
                init,
            ),
        )(folder(init))(resume(f)(data));
    return go;
};

export const foldMap =
    <F>(f: Foldable<F> & Functor<F>) =>
    <M>(monoid: Monoid<M>) =>
    <T>(mapper: (t: T) => M): (data: Free<F, T>) => M => {
        const go = (data: Free<F, T>): M =>
            Result.mapOrElse(foldableFoldMap<F, Free<F, T>, M>(f, monoid)(go))(
                mapper,
            )(resume(f)(data));
        return go;
    };

export const traverse = <F>(
    app: Traversable<F> & Applicative<F>,
) =>
<A, B>(
    visitor: (a: A) => Get1<F, B>,
): (data: Free<F, A>) => Get1<F, Free<F, B>> => {
    const go = (data: Free<F, A>): Get1<F, Free<F, B>> =>
        Result.mapOrElse((fa: Get1<F, Free<F, A>>): Get1<F, Free<F, B>> =>
            app.map((a: Get1<F, Free<F, B>>) => flatten(liftF(a)))(
                app.traverse(app)(go)(fa),
            )
        )((a: A) => app.map(pure)(visitor(a)))(resume(app)(data));
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
        equalityE: equalityFA<Free<F, A>>(
            partialEq({ equalityA, equalityFA, functor }),
        ),
        equalityT: equalityA,
    })(resume(functor)(l), resume(functor)(r));
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
        equalityE: equalityFA<Free<F, A>>(
            eq({ equalityA, equalityFA, functor }),
        ),
        equalityT: equalityA,
    })(resume(functor)(l), resume(functor)(r));
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
        orderE: orderFA<Free<F, A>>(
            partialOrd({ orderA, orderFA, functor }),
        ),
        orderT: orderA,
    })(resume(functor)(l), resume(functor)(r));
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
        orderE: orderFA<Free<F, A>>(
            ord({ orderA, orderFA, functor }),
        ),
        orderT: orderA,
    })(resume(functor)(l), resume(functor)(r));
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
        const view = resume(monad)(fr);
        if (Result.isOk(view)) {
            return monad.pure(view[1]);
        }
        return monad.flatMap(retract(monad))(view[1]);
    };

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
        const view = resume(functor)(fr);
        if (Result.isOk(view)) {
            return view[1];
        }
        return fn(functor.map(iter(functor)(fn))(view[1]));
    };

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
        const view = resume(functor)(fr);
        if (Result.isOk(view)) {
            return app.pure(view[1]);
        }
        return fn(functor.map(iterA(app, functor)(fn))(view[1]));
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
        const view = resume(functor)(fr);
        if (Result.isOk(view)) {
            return monad.pure(view[1]);
        }
        return fn(functor.map(iterM(monad, functor)(fn))(view[1]));
    };

/**
 * Hoists the items of `Free` by the natural transformation.
 *
 * @param nat - The natural transformation.
 * @returns The lifted transformation of `Free`.
 */
export const hoistFree = <F, G>(
    nat: Nt<F, G>,
): <T>(fr: Free<F, T>) => Free<G, T> =>
    substFree({ nt: <T>(ft: Get1<F, T>): Free<G, T> => liftF(nat.nt(ft)) });

/**
 * Make a product from two `Free`s.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param a - The left-side of a product.
 * @param b - The right-side of a product.
 * @returns The product of two `Free`s.
 */
export const productT =
    <F, A>(a: Free<F, A>) => <B>(b: Free<F, B>): Free<F, Tuple<A, B>> =>
        flatMap((a: A) => map((b: B): Tuple<A, B> => [a, b])(b))(a);

/**
 * Folds all the values in `Free` with monad `M`.
 *
 * @param m - The instance of `Monad` for `M`.
 * @param fn - The folder for `M`.
 * @param fr - The instance of `Free`.
 * @returns The folded value contained by `M`.
 */
export const foldFree = <M>(m: MonadRec<M>) =>
<F>(
    nat: Nt<F, M>,
): Nt<Apply2Only<FreeHkt, F>, M> => ({
    nt: <T>(ft: Free<F, T>): Get1<M, T> =>
        m.tailRecM<T, Free<F, T>>(
            (f: Free<F, T>): Get1<M, ControlFlow<T, Free<F, T>>> => {
                const view = toView(f)<M>();
                if (isReturn(view)) {
                    return m.map(newBreak<T>)(m.pure(view[1]));
                }
                return m.map((item: M) => newContinue(view[2](item)))(
                    nat.nt(view[1]),
                );
            },
        )(ft),
});

/**
 * Lifts up the item into a `Free`.
 *
 * @param ft - The instance of `F` to be lifted.
 * @returns The new `Free`.
 */
export const liftF = <F, T>(ft: Get1<F, T>): Free<F, T> =>
    fromView(<
        S,
    >() => [
        bindNominal,
        ft as unknown as Get1<F, S>,
        (s: S) => pure(s as unknown as T),
    ]);

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
        const view = resume(functor)(fr);
        if (Result.isErr(view)) {
            return wrap(functor.map(cutoff(functor)(n - 1))(view[1]));
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
            Result.either((a: A) => monad.pure(pure(a)))((fb) =>
                monad.map(wrap)(
                    traversable.traverse(monad)(unfoldM(traversable, monad)(f))(
                        fb,
                    ),
                )
            ),
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

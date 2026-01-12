import type { Apply2Only, Get1, Hkt2 } from "./hkt.js";
import type { MonadReader } from "./reader/monad.js";
import type { Tuple } from "./tuple.js";
import { type AbelianGroup, abelSymbol } from "./type-class/abelian-group.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Arrow } from "./type-class/arrow.js";
import type { Distributive } from "./type-class/distributive.js";
import type { Functor } from "./type-class/functor.js";
import type { Group } from "./type-class/group.js";
import type { Monad } from "./type-class/monad.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

/**
 * The type of function from `A` to `B`.
 */
export type Fn<A, B> = (a: A) => B;

/**
 * The identity function which returns the passed value as is.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { id } from "./func.js";
 *
 * expect(id(2)).toStrictEqual(2);
 * expect(id("foo")).toStrictEqual("foo");
 * ```
 */
export const id = <T>(x: T) => x;

/**
 * The constant function which returns the first passed value.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { constant } from "./func.js";
 *
 * const fn = constant(4);
 * expect(fn(3)).toStrictEqual(4);
 * expect(fn("foo")).toStrictEqual(4);
 * ```
 */
export const constant =
    <T>(x: T) =>
    <U>(_u: U) =>
        x;

/**
 * Indicates the unreachable code path. Calling this throws an error immediately, so this function should be called only if your application data is not consistent.
 *
 * # Examples
 *
 * ```ts
 * import { absurd } from "./func.js";
 * import { assertThrows } from "vitest";
 *
 * assertThrows(() => {
 *     absurd<number>();
 *     throw new Error("this line must not be run");
 * }, "PANIC: absurd must not be called");
 * ```
 */
export const absurd = <T>(): T => {
    throw new Error("PANIC: absurd must not be called");
};

/**
 * Composes two functions sequentially. `z = pipe(a)(b)(x)` means `y = a(x), z = b(y)`.
 *
 * @param firstDo - The function to do at first.
 * @param secondDo - The function to do at last.
 * @returns The composed function.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { pipe } from "./func.js";
 *
 * expect(pipe((x: number) => x + 1)((x) => x * 2)(3)).toStrictEqual(8);
 * ```
 */
export const pipe =
    <T, U>(firstDo: Fn<T, U>) =>
    <V>(secondDo: Fn<U, V>) =>
    (t: T): V =>
        secondDo(firstDo(t));

/**
 * Composes two functions mathematically. `compose(f)(g)(x)` means `f(g(x))`.
 *
 * @param f - The function to do at last.
 * @param g - The function to do at first.
 * @returns The composed function.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { compose } from "./func.js";
 *
 * expect(compose((x: number) => x + 1)((x: number) => x * 2)(3)).toStrictEqual(7);
 * ```
 */
export const compose =
    <U, V>(f: Fn<U, V>) =>
    <T>(g: Fn<T, U>) =>
    (t: T): V =>
        f(g(t));

/**
 * Flips two arguments of the function.
 *
 * @param f - The function with two arguments.
 * @returns The function flipped the arguments.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { flip } from "./func.js";
 *
 * const fn = flip((a: string) => (b: string) => a + b);
 * expect(fn("a")("b")).toStrictEqual("ba");
 * expect(fn("asd")("btg")).toStrictEqual("btgasd");
 * ```
 */
export const flip =
    <T, U, V>(f: Fn<T, Fn<U, V>>): Fn<U, Fn<T, V>> =>
    (u) =>
    (t) =>
        f(t)(u);

/**
 * Repeats the `succ` operation until `pred` returns `true`.
 *
 * @param pred - The predicate whether the operation is done.
 * @param succ - The recursion successor of the operation.
 * @param init - The initial term of the operation.
 * @returns The found value while operations.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { until } from "./func.js";
 *
 * const padLeft = until((x: string) => 4 <= x.length)((x) => "0" + x);
 * expect(padLeft("")).toStrictEqual("0000");
 * expect(padLeft("1")).toStrictEqual("0001");
 * expect(padLeft("13")).toStrictEqual("0013");
 * expect(padLeft("131")).toStrictEqual("0131");
 * expect(padLeft("1316")).toStrictEqual("1316");
 * expect(padLeft("1316534")).toStrictEqual("1316534");
 * ```
 */
export const until =
    <T>(pred: (t: T) => boolean) =>
    (succ: (t: T) => T) =>
    (init: T): T => {
        while (!pred(init)) {
            init = succ(init);
        }
        return init;
    };

/**
 * Maps the hom `X => A` with `f`.
 *
 * @param f - The function to map from `A`.
 * @param a - The hom to be mapped.
 * @returns The mapped hom.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { map } from "./func.js";
 *
 * const mapper = map<string>()((x: number) => x * 2);
 * expect(mapper(parseInt)("20")).toStrictEqual(40);
 * ```
 */
export const map =
    <X>() =>
    <A, B>(f: (a: A) => B) =>
    (a: Fn<X, A>): Fn<X, B> =>
        pipe(a)(f);

/**
 * Applies the hom `X => A => B` to another hom `X => A`.
 *
 * @param f - The hom returns the function to apply.
 * @param g - The hom to be applied.
 * @returns The applied hom.
 *
 * # Examples
 *
 * ```ts
 * import { apply } from "./func.js";
 * import { assertEquals } from "vitest";
 *
 * const applier = apply<string>()((str) => (radix: number) =>
 *     parseInt(str, radix)
 * );
 * expect(applier(parseInt)("11")).toStrictEqual(12);
 * ```
 */
export const apply =
    <X>() =>
    <A, B>(f: Fn<X, (a: A) => B>) =>
    (g: Fn<X, A>): Fn<X, B> =>
    (x) =>
        f(x)(g(x));

/**
 * Lifts the binary operation `q` over the hom `X => _`.
 *
 * @param q - The binary operation takes `A` and `B`.
 * @param f - The hom `X => A`.
 * @param g - The hom `X => B`.
 * @returns The lifted hom `X => C`.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { liftBinary } from "./func.js";
 *
 * const lifter = liftBinary<void>()((a: number) => (b: number) => a + b);
 * expect(lifter(() => 1)(() => 2)()).toStrictEqual(3);
 * ```
 */
export const liftBinary =
    <X>() =>
    <A, B, C>(q: (a: A) => (b: B) => C) =>
    (f: Fn<X, A>) =>
    (g: Fn<X, B>): Fn<X, C> =>
    (x) =>
        q(f(x))(g(x));

/**
 * Maps and flattens the hom with `fn`.
 *
 * @param fn - The function which maps from `A` to the hom `X => B`.
 * @param a - The hom `X => A`.
 * @returns The mapped hom `X => B`.
 *
 * # Examples
 *
 * ```ts
 * import { assertEquals } from "vitest";
 * import { flatMap } from "./func.js";
 *
 * const mapper = flatMap<number>()((x: number) => (y: number) => x * y);
 * expect(mapper((x) => x + 1)(3)).toStrictEqual(12);
 * ```
 */
export const flatMap =
    <X>() =>
    <A, B>(fn: (a: A) => Fn<X, B>) =>
    (a: Fn<X, A>): Fn<X, B> =>
    (x) =>
        fn(a(x))(x);

/**
 * Splits two inputs between two functions.
 *
 * @param arrow1 - The function to be mapped on the first.
 * @param arrow2 - The function to be mapped on the second.
 * @returns The composed function.
 */
export const split: <B1, C1>(
    arrow1: Fn<B1, C1>,
) => <B2, C2>(arrow2: Fn<B2, C2>) => Fn<Tuple<B1, B2>, Tuple<C1, C2>> =
    (arrow1) =>
    (arrow2) =>
    ([b1, b2]) => [arrow1(b1), arrow2(b2)];

export interface FnHkt extends Hkt2 {
    readonly type: Fn<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Fn<E, _>`.
 */
export const functor = <E>(): Functor<Apply2Only<FnHkt, E>> => ({
    map: compose,
});

/**
 * The instance of `Applicative` for `Fn<X, _>`.
 */
export const applicative = <X>(): Applicative<Apply2Only<FnHkt, X>> => ({
    map: map(),
    pure: constant,
    apply: apply(),
});

/**
 * The instance of `Monad` for `Fn<X, _>`.
 */
export const monad = <X>(): Monad<Apply2Only<FnHkt, X>> => ({
    ...applicative(),
    flatMap: flatMap(),
});

/**
 * The `Distributive` instance for `Fn<X, _>`.
 */
export const distributive = <X>(): Distributive<Apply2Only<FnHkt, X>> => ({
    map: map(),
    distribute:
        <F>(functor: Functor<F>) =>
        <A>(f: Get1<F, (x: X) => A>) =>
        (x: X): Get1<F, A> =>
            functor.map((fn: (x: X) => A) => fn(x))(f),
});

/**
 * The instance of `MonadReader` for `Fn<R, _>`.
 */
export const monadReader = <R>(): MonadReader<R, Apply2Only<FnHkt, R>> => ({
    ...monad(),
    ask: () => id,
    local: pipe,
});

/**
 * The instance of `Arrow` for `Fn`. It is useful to construct the bifunctor with functions.
 */
export const fnArrow: Arrow<FnHkt> = {
    compose,
    identity: () => id,
    arr: id,
    split,
};

/**
 * @param gr - The instance of `Group` for `B`.
 * @returns The instance of `Group` for `Fn<A, B>`.
 */
export const group = <A, B>(gr: Group<B>): Group<Fn<A, B>> => ({
    combine: (l, r) => (a) => gr.combine(l(a), r(a)),
    identity: () => gr.identity,
    invert: (g) => (a) => gr.invert(g(a)),
    [semiGroupSymbol]: true,
});

/**
 * @param gr - The instance of `AbelianGroup` for `B`.
 * @returns The instance of `AbelianGroup` for `Fn<A, B>`.
 */
export const abelianGroup = <A, B>(
    gr: AbelianGroup<B>,
): AbelianGroup<Fn<A, B>> => ({
    combine: (l, r) => (a) => gr.combine(l(a), r(a)),
    identity: () => gr.identity,
    invert: (g) => (a) => gr.invert(g(a)),
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
});

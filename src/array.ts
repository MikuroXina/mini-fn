import type { Get1, Hkt1 } from "./hkt.js";
import { andThen, map as mapOption, type Option, some } from "./option.js";
import { and, type Ordering } from "./ordering.js";
import {
    type Decoder,
    decU32Be,
    type Encoder,
    encFoldable,
    flatMapDecoder,
    pureDecoder,
} from "./serial.js";
import type { Alternative } from "./type-class/alternative.js";
import { type Applicative, liftA2 } from "./type-class/applicative.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Foldable } from "./type-class/foldable.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { MonadPlus } from "./type-class/monad-plus.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import {
    fromPartialEquality,
    type PartialEq,
    type PartialEqUnary,
} from "./type-class/partial-eq.js";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.js";
import type { Reduce } from "./type-class/reduce.js";
import type { Traversable } from "./type-class/traversable.js";
import type { TraversableMonad } from "./type-class/traversable-monad.js";

/**
 * Make a partial equality between `readonly L[]` and `readonly R[]` from the partial equality between `L` and `R`.
 *
 * @param equality - The partial equality between `L` and `R`.
 * @returns A partial equality between `readonly L[]` and `readonly R[]`
 */
export const partialEquality =
    <L, R = L>(equality: PartialEq<L, R>) =>
    (l: readonly L[], r: readonly R[]): boolean =>
        l.length === r.length && l.every((left, i) => equality.eq(left, r[i]!));
/**
 * The `PartialEq` instance for `Array`.
 */
export const partialEq: <L, R>(
    equality: PartialEq<L, R>,
) => PartialEq<L[], R[]> = fromPartialEquality(partialEquality);
/**
 * Make a partial order between `readonly L[]` and `readonly R[]` from the partial order between `L` and `R`.
 *
 * @param equality - The partial order between `L` and `R`.
 * @returns A partial order between `readonly L[]` and `readonly R[]`
 */
export const partialCmp =
    <L, R = L>(order: PartialOrd<L, R>) =>
    (l: readonly L[], r: readonly R[]): Option<Ordering> =>
        foldR(
            (
                next: Option<Ordering>,
            ): ((acc: Option<Ordering>) => Option<Ordering>) =>
                andThen((a: Ordering) => mapOption(and(a))(next)),
        )(some(Math.sign(l.length - r.length) as Ordering))(
            l.map((left, i) => order.partialCmp(left, r[i]!)),
        );
/**
 * The `PartialOrd` instance for `Array`.
 */
export const partialOrd: <T>(order: PartialOrd<T>) => PartialOrd<T[]> =
    fromPartialCmp(partialCmp);
/**
 * Make an equality between `readonly L[]` and `readonly R[]` from the equality between `L` and `R`.
 *
 * @param equality - The equality between `L` and `R`.
 * @returns An equality between `readonly L[]` and `readonly R[]`
 */
export const equality =
    <L, R = L>(equality: Eq<L, R>) =>
    (l: readonly L[], r: readonly R[]): boolean =>
        l.length === r.length && l.every((left, i) => equality.eq(left, r[i]!));
/**
 * The `Eq` instance for `Array`.
 */
export const eq: <L, R = L>(equality: Eq<L, R>) => Eq<L[], R[]> =
    fromEquality(equality);
/**
 * Make a total order between `readonly L[]` and `readonly R[]` from the total order between `L` and `R`.
 *
 * @param equality - The total order between `L` and `R`.
 * @returns A total order between `readonly L[]` and `readonly R[]`
 */
export const cmp =
    <T>(order: Ord<T>) =>
    (l: readonly T[], r: readonly T[]): Ordering =>
        foldR(and)(Math.sign(l.length - r.length) as Ordering)(
            l.map((left, i) => order.cmp(left, r[i]!)),
        );
/**
 * The `Ord` instance for `Array`.
 */
export const ord: <T>(order: Ord<T>) => Ord<T[]> = fromCmp(cmp);

/**
 * The `PartialEqUnary` instance for `Array`.
 */
export const partialEqUnary: PartialEqUnary<ArrayHkt> = {
    liftEq:
        <Lhs, Rhs = Lhs>(equality: (l: Lhs, r: Rhs) => boolean) =>
        (l: readonly Lhs[], r: readonly Rhs[]) =>
            l.length === r.length &&
            l.every((lItem, i) => equality(lItem, r[i]!)),
};

/**
 * A higher kind type emulation for `Array`. It can be used as a type parameter of interfaces in `TypeClass` module.
 */
export interface ArrayHkt extends Hkt1 {
    readonly type: readonly this["arg1"][];
}

/**
 * Maps items of the array into another one.
 *
 * @param fn - Function to map an item.
 * @param src - To be mapped.
 * @returns A new mapped one.
 */
export const map =
    <T, U>(fn: (t: T) => U) =>
    (src: readonly T[]): readonly U[] =>
        src.map(fn);

/**
 * Wraps the item as an array.
 *
 * @param item - To be wrapped.
 * @returns A wrapped singleton array.
 */
export const pure = <T>(item: T): readonly T[] => [item];

/**
 * Applies functions in the array `fns` to items in the array `ts` exhaustively.
 *
 * @param fns - Array of functions to be applied.
 * @param ts - Items of functions to apply.
 * @returns The applied items.
 */
export const apply =
    <T, U>(fns: readonly ((t: T) => U)[]) =>
    (ts: readonly T[]): readonly U[] =>
        fns.flatMap((fn) => ts.map((t) => fn(t)));

/**
 * Maps items in the array `src` by `fn` and flattens.
 *
 * @param fn - Function to map an item into other items.
 * @param src - To be mapped.
 * @returns A new array of mapped items.
 */
export const flatMap =
    <T, U>(fn: (t: T) => readonly U[]) =>
    (src: readonly T[]): readonly U[] =>
        src.flatMap(fn);

/**
 * Folds items in the array into one.
 *
 * @param folder - Function to apply items from the right.
 * @param init - Initial state of folding.
 * @param data - To be folded.
 * @returns A folding result.
 */
export const foldR: <A, B>(
    folder: (next: A) => (acc: B) => B,
) => (init: B) => (data: readonly A[]) => B = (folder) => (init) => (data) =>
    data.reduceRight((prev, curr) => folder(curr)(prev), init);

/**
 * Traverses the array of `A` into an array of `B` over data structure `F`.
 *
 * @param app - The `Applicative` instance for `F`.
 * @param visitor - Function to map items into `B` over `F`.
 * @param data - To be traversed.
 * @returns A traverse results over `F`.
 */
export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (data: readonly A[]): Get1<F, readonly B[]> => {
        let res = app.pure([] as readonly B[]);
        for (const a of data) {
            res = liftA2(app)((b: B) => (bs: readonly B[]) => [...bs, b])(
                visitor(a),
            )(res);
        }
        return res;
    };

/**
 * Creates an empty array of `A`.
 */
export const empty = <A>(): readonly A[] => [];

/**
 * Concatenates two arrays into one.
 *
 * @param first - The left side to concatenate.
 * @param second - The right side to concatenate.
 * @returns The joined one.
 */
export const concat =
    <A>(first: readonly A[]) =>
    (second: readonly A[]): readonly A[] => [...first, ...second];

/**
 * Alias of `concat`.
 */
export const alt = concat;

/**
 * The `Functor` instance for `Array`.
 */
export const functor: Functor<ArrayHkt> = { map };

/**
 * The `Applicative` instance for `Array`.
 */
export const applicative: Applicative<ArrayHkt> = { map, pure, apply };

/**
 * The `Monad` instance for `Array`.
 */
export const monad: Monad<ArrayHkt> = { map, pure, apply, flatMap };

/**
 * The `Foldable` instance for `Array`.
 */
export const foldable: Foldable<ArrayHkt> = { foldR };

/**
 * The `Traversable` instance for `Array`.
 */
export const traversable: Traversable<ArrayHkt> = {
    ...functor,
    foldR,
    traverse,
};

/**
 * The `TraversableMonad` instance for `Array`.
 */
export const traversableMonad: TraversableMonad<ArrayHkt> = {
    ...traversable,
    ...monad,
};

/**
 * The `Alternative` instance for `Array`.
 */
export const alternative: Alternative<ArrayHkt> = {
    ...applicative,
    empty,
    alt,
};

/**
 * The `MonadPlus` instance for `Array`.
 */
export const monadPlus: MonadPlus<ArrayHkt> = { ...alternative, ...monad };

/**
 * Crates a new array from elements in `fa`.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The container having elements of `A`.
 * @returns The new array.
 */
export const fromReduce =
    <F>(reduce: Reduce<F>) =>
    <A>(fa: Get1<F, A>): ReadonlyArray<A> =>
        reduce.reduceL((arr: A[]) => (elem: A) => [...arr, elem])([])(fa);

/**
 * Reduces the elements of array by `reducer` from right-side.
 *
 * @param reducer - The reducer called with `A` and `B`.
 * @param fa - The array to be folded.
 * @returns The folded value.
 */
export const reduceR: <A, B>(
    reducer: (a: A) => (b: B) => B,
) => (fa: readonly A[]) => (b: B) => B = (reducer) => (as) => (b) => {
    const reversed = [...as].reverse();
    for (const a of reversed) {
        b = reducer(a)(b);
    }
    return b;
};
/**
 * Reduces the elements of array by `reducer` from left-side.
 *
 * @param reducer - The reducer called with `B` and `A`.
 * @param fa - The array to be folded.
 * @returns The folded value.
 */
export const reduceL: <A, B>(
    reducer: (b: B) => (a: A) => B,
) => (b: B) => (fa: readonly A[]) => B = (reducer) => (b) => (as) =>
    as.reduce((acc, a) => reducer(acc)(a), b);

/**
 * The instance of `Reduce` for `Array`.
 */
export const reduce: Reduce<ArrayHkt> = {
    reduceR,
    reduceL,
};

/**
 * The `Encoder` instance for `Array`.
 */
export const enc: <T>(encT: Encoder<T>) => Encoder<readonly T[]> =
    encFoldable(foldable);
/**
 * The `Decoder` instance for `Array`.
 */
export const dec = <A>(decA: Decoder<A>): Decoder<A[]> => {
    const go =
        (l: A[]) =>
        (lenToRead: number): Decoder<A[]> =>
            lenToRead === 0
                ? pureDecoder(l)
                : flatMapDecoder((item: A) => go([...l, item])(lenToRead - 1))(
                      decA,
                  );
    return flatMapDecoder(go([]))(decU32Be());
};

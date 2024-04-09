import {
    type Serial,
    type Serialize,
    serializeMonad,
    type Serializer,
} from "./serialize.ts";
import { doT } from "./cat.ts";
import {
    type Deserialize,
    type DeserializeError,
    newVisitor,
    type Visitor,
    visitorMonad,
} from "./deserialize.ts";
import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.ts";
import { defer as lazyDefer, force, type Lazy } from "./lazy.ts";
import { andThen, mapOrElse, type Option, zip } from "./option.ts";
import { andThen as thenWith, type Ordering } from "./ordering.ts";
import { err, ok, type Result } from "./result.ts";
import { type Applicative, liftA2 } from "./type-class/applicative.ts";
import { fromBifoldMap } from "./type-class/bifoldable.ts";
import type { Bifunctor } from "./type-class/bifunctor.ts";
import type { Bitraversable } from "./type-class/bitraversable.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import type { SemiGroup } from "./type-class/semi-group.ts";
import type { SemiGroupal } from "./type-class/semi-groupal.ts";

/**
 * The readonly tuple having `A` and `B`.
 */
export type Tuple<A, B> = readonly [A, B];

export const partialEquality = <A, B>(
    { equalityA, equalityB }: {
        equalityA: PartialEq<A>;
        equalityB: PartialEq<B>;
    },
) =>
(l: Tuple<A, B>, r: Tuple<A, B>): boolean =>
    equalityA.eq(l[0], r[0]) && equalityB.eq(l[1], r[1]);
export const partialEq = fromPartialEquality(partialEquality);
export const equality =
    <A, B>({ equalityA, equalityB }: { equalityA: Eq<A>; equalityB: Eq<B> }) =>
    (l: Tuple<A, B>, r: Tuple<A, B>): boolean =>
        equalityA.eq(l[0], r[0]) && equalityB.eq(l[1], r[1]);
export const eq = fromEquality(equality);
export const partialCmp =
    <A, B>({ ordA, ordB }: { ordA: PartialOrd<A>; ordB: PartialOrd<B> }) =>
    ([a1, b1]: Tuple<A, B>, [a2, b2]: Tuple<A, B>): Option<Ordering> =>
        andThen(() => ordB.partialCmp(b1, b2))(ordA.partialCmp(a1, a2));
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <A, B>({ ordA, ordB }: { ordA: Ord<A>; ordB: Ord<B> }) =>
    ([a1, b1]: Tuple<A, B>, [a2, b2]: Tuple<A, B>) =>
        thenWith(() => ordB.cmp(b1, b2))(ordA.cmp(a1, a2));
export const ord = fromCmp(cmp);

/**
 * Creates a new tuple from two provided values.
 *
 * @param a - The first element of a tuple.
 * @param b - The second element of a tuple.
 * @returns The new tuple.
 */
export const make = <A>(a: A) => <B>(b: B): Tuple<A, B> => [a, b];

/**
 * Gets the first element of the tuple.
 *
 * @param tuple - The source tuple.
 * @returns The first element of the tuple.
 */
export const first = <A, B>([a]: Tuple<A, B>): A => a;
/**
 * Gets the second element of the tuple.
 *
 * @param tuple - The source tuple.
 * @returns The second element of the tuple.
 */
export const second = <A, B>([, b]: Tuple<A, B>): B => b;

/**
 * Curries the function `f` which takes a tuple.
 *
 * @param f - The function takes a tuple.
 * @returns The curried function which takes two parameters.
 */
export const curry =
    <A, B, C>(f: (tuple: Tuple<A, B>) => C) => (a: A) => (b: B): C => f([a, b]);

/**
 * Uncurries the function `f` which takes two parameters.
 *
 * @param f - The function takes two parameters.
 * @returns The uncurried function which takes a tuple.
 */
export const uncurry =
    <A, B, C>(f: (a: A) => (b: B) => C) => ([a, b]: Tuple<A, B>): C => f(a)(b);

/**
 * Swaps elements of the tuple.
 *
 * @param tuple - The source tuple.
 * @returns The swapped tuple.
 */
export const swap = <A, B>([a, b]: Tuple<A, B>): Tuple<B, A> => [b, a];

/**
 * Maps the second element of the tuple with `f`.
 *
 * @param f - The function which maps the second element.
 * @param tuple - The tuple to be mapped.
 * @returns The mapped tuple.
 */
export const map =
    <A, B>(f: (a: A) => B) => <C>([c, a]: Tuple<C, A>): Tuple<C, B> => [
        c,
        f(a),
    ];
/**
 * Applies the function in the tuple to another tuple.
 *
 * @param sg - The instance of `SemiGroup` for `A`.
 * @param tuple1 - The tuple contains the function to apply.
 * @param tuple2 - The tuple contains the value to be applied.
 * @returns The applied tuple.
 */
export const apply =
    <A>(sg: SemiGroup<A>) =>
    <T, U>([a1, f]: Tuple<A, (t: T) => U>) =>
    ([a2, x]: Tuple<A, T>): Tuple<A, U> => [sg.combine(a1, a2), f(x)];
/**
 * Wraps the value into a tuple with monoid `A`.
 *
 * @param monoid - The instance of `Monoid` for `A`.
 * @param b - The value to be contained.
 * @returns The new tuple.
 */
export const pure =
    <A>(monoid: Monoid<A>) => <B>(b: B): Tuple<A, B> => [monoid.identity, b];
/**
 * Binds the tuple to the function which returns a tuple.
 *
 * @param sg - The instance of `SemiGroup` for `A`.
 * @param tuple - The tuple to be applied.
 * @param f - The function which returns a tuple.
 * @returns The bound tuple.
 */
export const bind =
    <A>(sg: SemiGroup<A>) =>
    <B>([a1, b]: Tuple<A, B>) =>
    <C>(f: (b: B) => Tuple<A, C>): Tuple<A, C> => {
        const [a2, c] = f(b);
        return [sg.combine(a1, a2), c];
    };

export const extend =
    <A>(f: <B>(tuple: Tuple<A, B>) => B) =>
    <B>(tuple: Tuple<A, B>): Tuple<A, B> => [tuple[0], f(tuple)];
/**
 * Extracts the value which has a type of the second type parameter `B`. It is equivalent to `second`.
 */
export const extract = second;

/**
 * Distributes `Tuple` in `Lazy`.
 *
 * @param lazy - The deferred tuple.
 * @returns The tuple of deferred functions.
 */
export const defer = <A, B>(
    lazy: Lazy<Tuple<A, B>>,
): Tuple<Lazy<A>, Lazy<B>> => [
    lazyDefer(() => first(force(lazy))),
    lazyDefer(() => second(force(lazy))),
];

/**
 * Folds the tuple having two `A`s with `folder` from right.
 *
 * @param folder - The function fold the data stored in a tuple.
 * @param init - The seed of folding.
 * @param data - The tuple to be folded.
 * @returns The folded value.
 */
export const foldR: <A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Tuple<A, A>) => B = (folder) => (init) => (data) => {
    const folded = folder(data[1])(init);
    return folder(data[0])(folded);
};

/**
 * Traverses the tuple with `visitor` on semi-groupal `F`.
 *
 * @param semi - The instance `SemiGroupal` for `F`.
 * @param visitor - The function to visit the data in a tuple.
 * @param tuple - The data to be traversed.
 * @returns The traversed tuple on `F`.
 */
export const traverse =
    <F>(semi: SemiGroupal<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    ([a1, a2]: [A, A]): Get1<F, Tuple<B, B>> =>
        semi.product<B, B>(visitor(a1))(visitor(a2));

/**
 * Maps both elements of the tuple.
 *
 * @param f - The function to map from `A`.
 * @returns The mapped tuple.
 */
export const mapD =
    <A, B>(f: (a: A) => B) => ([a1, a2]: Tuple<A, A>): Tuple<B, B> => [
        f(a1),
        f(a2),
    ];

/**
 * Maps both elements by two each mapper function.
 *
 * @param first - The function which maps from `A`.
 * @param second - The function which maps from `C`.
 * @param curr - The source tuple.
 * @returns The mapped tuple.
 */
export const biMap: <A, B>(
    first: (a: A) => B,
) => <C, D>(second: (c: C) => D) => (curr: Tuple<A, C>) => Tuple<B, D> =
    (f) => (g) => ([a, c]) => [f(a), g(c)];

/**
 * Traverses both elements with an applicative functor.
 *
 * @param app - The instance of `Applicative`.
 * @param f - The function which maps from `A`.
 * @param g - The function which maps from `B`.
 * @param data - The source tuple.
 * @returns The mapped and lifted tuple.
 */
export const bitraverse: <F>(
    app: Applicative<F>,
) => <A, C>(
    f: (a: A) => Get1<F, C>,
) => <B, D>(
    g: (b: B) => Get1<F, D>,
) => (data: Tuple<A, B>) => Get1<F, Tuple<C, D>> =
    (app) => (f) => (g) => ([a, b]) => liftA2(app)(make)(f(a))(g(b));

export interface TupleHkt extends Hkt2 {
    readonly type: Tuple<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Tuple<A, _>`.
 */
export const functor = <A>(): Functor<Apply2Only<TupleHkt, A>> => ({ map });

export interface TupleDHkt extends Hkt1 {
    readonly type: Tuple<this["arg1"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Tuple<_, _>`.
 */
export const functorD: Functor<TupleDHkt> = { map: mapD };

/**
 * The instance of `Bifunctor` for `Tuple<_, _>`.
 */
export const bifunctor: Bifunctor<TupleHkt> = { biMap };

/**
 * The instance of `Bitraversal` for `Tuple<_, _>`.
 */
export const bifoldable = fromBifoldMap<TupleHkt>(
    (m) => (aMap) => (bMap) => ([a, b]) => m.combine(aMap(a), bMap(b)),
);

/**
 * The instance of `Bitraversable` for `Tuple<_, _>`.
 */
export const bitraversable: Bitraversable<TupleHkt> = {
    ...bifunctor,
    ...bifoldable,
    bitraverse,
};

export const serialize =
    <A>(serializeA: Serialize<A>) =>
    <B>(serializeB: Serialize<B>): Serialize<Tuple<A, B>> =>
    <S>(v: Tuple<A, B>) =>
    (ser: Serializer<S>): Serial<S> =>
        doT(serializeMonad<S>()).addM(
            "serTuple",
            ser.serializeTuple(2),
        ).addMWith("_", ({ serTuple }) =>
            serTuple.serializeElement(serializeA)(v[0]))
            .addMWith("_", ({ serTuple }) =>
                serTuple.serializeElement(serializeB)(v[1]))
            .finishM(({ serTuple }) =>
                serTuple.end()
            ) as Serial<S>;

export const visitor =
    <A>(deserializeA: Deserialize<A>) =>
    <B>(deserializeB: Deserialize<B>): Visitor<Tuple<A, B>> =>
        newVisitor("Tuple")({
            visitArray: (array) =>
                doT(visitorMonad<Tuple<A, B>>())
                    .addM("first", array.nextElement(deserializeA))
                    .addM("second", array.nextElement(deserializeB))
                    .finishM(
                        ({ first, second }) => () =>
                            mapOrElse((): Result<
                                DeserializeError,
                                Tuple<A, B>
                            > => err(() => "expected two items"))((
                                [a, b]: [A, B],
                            ) => ok(make(a)(b)))(zip(first)(second)),
                    ),
        });

export const deserialize =
    <A>(deserializeA: Deserialize<A>) =>
    <B>(deserializeB: Deserialize<B>): Deserialize<Tuple<A, B>> =>
    (de) => de.deserializeArray(visitor(deserializeA)(deserializeB));

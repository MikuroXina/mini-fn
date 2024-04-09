import type { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import {
    type Deserialize,
    newVisitor,
    variantsDeserialize,
    type Visitor,
    visitorMonad,
    type VisitorRet,
} from "./deserialize.ts";
import { id } from "./identity.ts";
import { appendToHead, either, empty, type List } from "./list.ts";
import { make as makeTuple, type Tuple } from "./tuple.ts";
import type { Applicative } from "./type-class/applicative.ts";
import type { Bifunctor } from "./type-class/bifunctor.ts";
import { type Eq, eqSymbol } from "./type-class/eq.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { PartialEq } from "./type-class/partial-eq.ts";
import { type SemiGroup, semiGroupSymbol } from "./type-class/semi-group.ts";
import {
    type Serial,
    type Serialize,
    serializeMonad,
    type Serializer,
} from "./serialize.ts";
import { doT } from "./cat.ts";

const thisSymbol = Symbol("TheseThis");
/**
 * The variant of `These` represents there is only the left value.
 */
export type This<A> = readonly [typeof thisSymbol, A];
/**
 * Creates a new `This` with the value.
 *
 * @param a - The value to be contained.
 * @returns The new `This`.
 */
export const newThis = <A>(a: A): This<A> => [thisSymbol, a];
/**
 * Checks whether the `These` is a `This`.
 *
 * @param these - The `These` to be checked.
 * @returns Whether the `These` is a `This`.
 */
export const isThis = <A, B>(these: These<A, B>): these is This<A> =>
    these[0] === thisSymbol;

const thatSymbol = Symbol("TheseThat");
/**
 * The variant of `These` represents there is only the right value.
 */
export type That<B> = readonly [typeof thatSymbol, B];
/**
 * Creates a new `That` with the value.
 *
 * @param a - The value to be contained.
 * @returns The new `That`.
 */
export const newThat = <B>(b: B): That<B> => [thatSymbol, b];
/**
 * Checks whether the `These` is a `That`.
 *
 * @param these - The `These` to be checked.
 * @returns Whether the `These` is a `That`.
 */
export const isThat = <A, B>(these: These<A, B>): these is That<B> =>
    these[0] === thatSymbol;

const bothSymbol = Symbol("TheseBoth");
/**
 * The variant of `These` represents there are both of the values.
 */
export type Both<A, B> = readonly [typeof bothSymbol, A, B];
/**
 * Creates a new `Both` with the values.
 *
 * @param a - The first value to be contained.
 * @param b - The second value to be contained.
 * @returns The new `Both`.
 */
export const newBoth = <A>(a: A) => <B>(b: B): Both<A, B> => [bothSymbol, a, b];
/**
 * Checks whether the `These` is a `Both`.
 *
 * @param these - The `These` to be checked.
 * @returns Whether the `These` is a `Both`.
 */
export const isBoth = <A, B>(these: These<A, B>): these is Both<A, B> =>
    these[0] === bothSymbol;

/**
 * The type of three variants:
 *
 * - `This`: there is only the left value.
 * - `That`: there is only the right value.
 * - `Both`: there are both of the left and right values.
 *
 * This can be useful to represent combinations of two values.
 */
export type These<A, B> = This<A> | That<B> | Both<A, B>;

export interface TheseHkt extends Hkt2 {
    readonly type: These<this["arg2"], this["arg1"]>;
}

export const partialEq = <A, B>(
    equalityA: PartialEq<A>,
    equalityB: PartialEq<B>,
): PartialEq<These<A, B>> => ({
    eq: (l, r) => {
        if (isThis(l) && isThis(r)) {
            return equalityA.eq(l[1], r[1]);
        }
        if (isThat(l) && isThat(r)) {
            return equalityB.eq(l[1], r[1]);
        }
        if (isBoth(l) && isBoth(r)) {
            return equalityA.eq(l[1], r[1]) && equalityB.eq(l[2], r[2]);
        }
        return false;
    },
});
export const eq = <A, B>(
    equalityA: Eq<A>,
    equalityB: Eq<B>,
): Eq<These<A, B>> => ({
    ...partialEq(equalityA, equalityB),
    [eqSymbol]: true,
});

/**
 * Exhausts the all patterns of `These`.
 *
 * @param onThis - The case of `This`.
 * @param onThat - The case of `That`.
 * @param onBoth - The case of `Both`.
 * @returns The value calculated by either of three functions.
 */
export const these =
    <A, C>(onThis: (a: A) => C) =>
    <B>(onThat: (b: B) => C) =>
    (onBoth: (a: A) => (b: B) => C) =>
    (t: These<A, B>): C => {
        switch (t[0]) {
            case thisSymbol:
                return onThis(t[1]);
            case thatSymbol:
                return onThat(t[1]);
            case bothSymbol:
                return onBoth(t[1])(t[2]);
        }
    };

/**
 * Converts the `These` into a tuple with provided default values.
 *
 * @param defaultA - The default value for left side.
 * @param defaultB - The default value for right side.
 * @param t - The source `These`.
 * @returns The converted tuple.
 */
export const intoTuple =
    <A>(defaultA: A) => <B>(defaultB: B): (t: These<A, B>) => Tuple<A, B> =>
        these((a: A) => makeTuple(a)(defaultB))(makeTuple(defaultA)<B>)(
            makeTuple,
        );

/**
 * Maps both over `These` by two mappers.
 *
 * @param first - The mapper for left value.
 * @param second - The mapper for right value.
 * @param curr - The source `These`.
 * @returns The mapped `These`.
 */
export const biMap =
    <A, B>(first: (a: A) => B) =>
    <C, D>(second: (c: C) => D): (curr: These<A, C>) => These<B, D> =>
        these((a: A) => newThis(first(a)) as These<B, D>)(
            (c: C) => newThat(second(c)) as These<B, D>,
        )((a) => (c) => newBoth(first(a))(second(c)) as These<B, D>);

/**
 * Merges the `These` having same types in the type parameters with `merger`.
 *
 * @param merger - The function used on `Both` case to merge its values.
 * @returns The contained value on cases of either `This` or `That`, or merged value by `merge` on case of `Both`.
 */
export const merge = <A>(
    merger: (thisA: A) => (thatA: A) => A,
): (t: These<A, A>) => A => these(id<A>)(id<A>)(merger);

/**
 * Maps and merges the `These`'s value with the provided functions.
 *
 * @param f - The mapper on `This` case.
 * @param g - The mapper on `That` case.
 * @param merge - The function used to merge the mapped values.
 * @returns The mapped and merged value.
 */
export const mergeWith =
    <A, C>(f: (a: A) => C) =>
    <B>(g: (b: B) => C) =>
    (merger: (thisC: C) => (thatC: C) => C) =>
    (t: These<A, B>): C => merge(merger)(biMap(f)(g)(t));

/**
 * Sorts out the list of `These`s into the lists of `This`, `That` and `Both` values.
 *
 * @param list - The list of `These`s.
 * @returns The tuple of the list of values contained by `This`, `That` and `Both` respectively.
 */
export const partition = <A, B>(
    list: List<These<A, B>>,
): [List<A>, List<B>, List<Tuple<A, B>>] =>
    either<[List<A>, List<B>, List<Tuple<A, B>>]>(
        () => [empty(), empty(), empty()],
    )(
        (t: These<A, B>, ts: List<These<A, B>>) => {
            const [restThis, restThat, restBoth] = partition(ts);
            return these<A, [List<A>, List<B>, List<Tuple<A, B>>]>((a) => [
                appendToHead(a)(restThis),
                restThat,
                restBoth,
            ])<B>((b) => [restThis, appendToHead(b)(restThat), restBoth])(
                (a) => (b) => [
                    restThis,
                    restThat,
                    appendToHead(makeTuple(a)(b))(restBoth),
                ],
            )(t);
        },
    )(list);

/**
 * Sorts out the list of `These`s into the lists of left and right values.
 *
 * @param list - The list of `These`s.
 * @returns The tuple of list of values of left and right respectively.
 */
export const partitionHere = <A, B>(
    list: List<These<A, B>>,
): [List<A>, List<B>] =>
    either<[List<A>, List<B>]>(() => [empty(), empty()])(
        (t: These<A, B>, ts: List<These<A, B>>) => {
            const [restThis, restThat] = partitionHere(ts);
            return these<A, [List<A>, List<B>]>((
                a,
            ) => [appendToHead(a)(restThis), restThat])<B>(
                (b) => [restThis, appendToHead(b)(restThat)],
            )(
                (a) => (b) => [
                    appendToHead(a)(restThis),
                    appendToHead(b)(restThat),
                ],
            )(t);
        },
    )(list);

/**
 * Distributes `Tuple` in `These`.
 *
 * @param t - The `These` having a tuple on left.
 * @returns The distributed tuple of `These`s.
 */
export const distributeTheseTuple = <A, B, C>(
    t: These<Tuple<A, B>, C>,
): Tuple<These<A, C>, These<B, C>> =>
    these<Tuple<A, B>, Tuple<These<A, C>, These<B, C>>>(([a, b]) =>
        makeTuple(newThis(a))(newThis(b))
    )<C>((c) => makeTuple(newThat(c))(newThat(c)))(
        ([a, b]) => (c) => makeTuple(newBoth(a)(c))(newBoth(b)(c)),
    )(t);

/**
 * Undistributes `Tuple` in `These`.
 *
 * @param t - The tuple having `These`s.
 * @returns The undistributed `These` of tuples.
 */
export const undistributeTheseTuple = <A, B, C>(
    [t1, t2]: Tuple<These<A, C>, These<B, C>>,
): These<
    Tuple<A, B>,
    C
> => {
    if (isThat(t1)) {
        return t1;
    }
    if (isThat(t2)) {
        if (isThis(t1)) {
            return t2;
        }
        return newThat(t1[2]);
    }
    if (isThis(t1)) {
        if (isThis(t2)) {
            return newThis(makeTuple(t1[1])(t2[1]));
        }
        return newBoth(makeTuple(t1[1])(t2[1]))(t2[2]);
    }
    const b = t2[1];
    return newBoth(makeTuple(t1[1])(b))(t1[2]);
};

/**
 * Distributes `These` in `Tuple`.
 *
 * @param t - The tuple having a `These` on left.
 * @returns The distributed `These` of tuples.
 */
export const distributeTupleThese = <A, B, C>(
    [t, c]: Tuple<These<A, B>, C>,
): These<
    Tuple<A, C>,
    Tuple<B, C>
> => these<A, These<Tuple<A, C>, Tuple<B, C>>>((a) => newThis(makeTuple(a)(c)))<
    B
>((b) => newThat(makeTuple(b)(c)))((a) => (b) =>
    newBoth(makeTuple(a)(c))(makeTuple(b)(c))
)(t);

/**
 * Undistributes `These` in `Tuple`.
 *
 * @param t - The `These` having `Tuple`s.
 * @returns The undistributed `These` in `Tuple`.
 */
export const undistributeTupleThese = <A, B, C>(
    t: These<Tuple<A, C>, Tuple<B, C>>,
): Tuple<These<A, B>, C> =>
    these<Tuple<A, C>, Tuple<These<A, B>, C>>(([a, c]) =>
        makeTuple(newThis(a))(c)
    )<Tuple<B, C>>(
        ([b, c]) => makeTuple(newThat(b))(c),
    )(
        ([a, c]) => ([b]) => makeTuple(newBoth(a)(b))(c),
    )(t);

/**
 * Combines two `These`s with the instances of `SemiGroup` for `A` and `B`.
 *
 * @param semiA - The instance of `SemiGroup` for `A`.
 * @param semiB - The instance of `SemiGroup` for `B`.
 * @param l - The left-side `These`.
 * @param r - The right-side `These`.
 * @returns The combined `These`
 */
export const combine =
    <A, B>(semiA: SemiGroup<A>, semiB: SemiGroup<B>) =>
    (l: These<A, B>, r: These<A, B>): These<A, B> => {
        if (isThis(l)) {
            const leftA = l[1];
            return these<A, These<A, B>>((rightA) =>
                newThis(semiA.combine(leftA, rightA))
            )<B>(
                (rightB) => newBoth(leftA)(rightB),
            )((rightA) => (rightB) =>
                newBoth(semiA.combine(leftA, rightA))(rightB)
            )(r);
        }
        if (isThat(l)) {
            const leftB = l[1];
            return these<A, These<A, B>>((rightA) => newBoth(rightA)(leftB))<B>(
                (rightB) => newThat(semiB.combine(leftB, rightB)),
            )((rightA) => (rightB) =>
                newBoth(rightA)(semiB.combine(leftB, rightB))
            )(r);
        }
        const [, leftA, leftB] = l;
        return these<A, These<A, B>>((rightA) =>
            newBoth(semiA.combine(leftA, rightA))(leftB)
        )<B>(
            (rightB) => newBoth(leftA)(semiB.combine(leftB, rightB)),
        )(
            (rightA) => (rightB) =>
                newBoth(semiA.combine(leftA, rightA))(
                    semiB.combine(leftB, rightB),
                ),
        )(r);
    };

/**
 * Maps the right value of `These` with `fn`.
 *
 * @param fn - The function to map.
 * @param t - The `These` to be mapped.
 * @returns The mapped `These`.
 */
export const map =
    <B, C>(fn: (b: B) => C) => <A>(t: These<A, B>): These<A, C> =>
        these<A, These<A, C>>((a) => newThis(a))<B>((b) => newThat(fn(b)))(
            (a) => (b) => newBoth(a)(fn(b)),
        )(t);

/**
 * Folds the value in the right of `These`. The left value will be ignored and `init` will be used.
 *
 * @param folder - The function to fold the contained value.
 * @param init - The seed of folding.
 * @param data - The `These` to fold.
 * @returns The folded value.
 */
export const foldR =
    <A, B>(folder: (a: A) => (b: B) => B) =>
    (init: B) =>
    <X>(data: These<X, A>): B =>
        these<X, B>(() => init)<A>((a) => folder(a)(init))(() => (a) =>
            folder(a)(init)
        )(data);

/**
 * Traverses the `These` with `visitor` on an applicative `F`.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param visitor - The function to traverse the right value.
 * @param data - The `These` to be traversed.
 * @returns The traversed `These` on `F`.
 */
export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    <X>(data: These<X, A>): Get1<F, These<X, B>> =>
        these<X, Get1<F, These<X, B>>>((x) => app.pure(newThis(x)))<A>((b) =>
            app.map(newThat)(visitor(b))
        )((x) => (b) => app.map(newBoth(x))(visitor(b)))(data);

/**
 * Applies the function to the value over `These<A, _>` with semi-group `A`.
 *
 * @param semi - The instance of `SemiGroup` for `A`.
 * @param fn - The function to apply in a `These`.
 * @param t - The `These` to be applied.
 * @returns The applied `These`.
 */
export const apply =
    <A>(semi: SemiGroup<A>) =>
    <T, U>(fn: These<A, (t: T) => U>) =>
    (t: These<A, T>): These<A, U> => {
        if (isThis(fn)) {
            return newThis(fn[1]);
        }
        if (isThis(t)) {
            return newThis(t[1]);
        }
        if (isThat(fn)) {
            if (isThat(t)) {
                return newThat(fn[1](t[1]));
            }
            return newBoth(t[1])(fn[1](t[2]));
        }
        if (isThis(t)) {
            return newThis(semi.combine(fn[1], t[1]));
        }
        if (isThat(t)) {
            return newBoth(fn[1])(fn[2](t[1]));
        }
        return newBoth(semi.combine(fn[1], t[1]))(fn[2](t[2]));
    };

/**
 * Maps and flattens the `These` by `fn` over `These<A, _>` with semi-group `A`.
 *
 * @param semi - The instance of `SemiGroup` for `A`.
 * @param fn - The function to map from `T`.
 * @param t - The `These` to be mapped.
 * @returns The mapped and flattened `These`.
 */
export const flatMap =
    <A>(semi: SemiGroup<A>) =>
    <T, U>(fn: (t: T) => These<A, U>) =>
    (t: These<A, T>): These<A, U> => {
        if (isThis(t)) {
            return newThis(t[1]);
        }
        if (isThat(t)) {
            return fn(t[1]);
        }
        const mapped = fn(t[2]);
        if (isThis(mapped)) {
            return newThis(semi.combine(t[1], mapped[1]));
        }
        if (isThat(mapped)) {
            return newBoth(t[1])(mapped[1]);
        }
        return newBoth(semi.combine(t[1], mapped[1]))(mapped[2]);
    };

/**
 * Creates the instance of `SemiGroup` from the instances of `A` and `B`.
 *
 * @param semiA - The instance of `SemiGroup` for `A`.
 * @param semiB - The instance of `SemiGroup` for `B`.
 * @returns The instance of `SemiGroup` for `These<A, B>`.
 */
export const semiGroup = <A, B>(
    semiA: SemiGroup<A>,
    semiB: SemiGroup<B>,
): SemiGroup<These<A, B>> => ({
    combine: combine(semiA, semiB),
    [semiGroupSymbol]: true,
});

/**
 * The instance of `Functor` for `These<A, _>`.
 */
export const functor = <A>(): Functor<Apply2Only<TheseHkt, A>> => ({ map });

/**
 * The instance of `Foldable` for `These<X, _>`.
 */
export const foldable = <X>(): Foldable<Apply2Only<TheseHkt, X>> => ({ foldR });

/**
 * The instance of `Bifunctor` for `These`.
 */
export const bifunctor: Bifunctor<TheseHkt> = { biMap };

/**
 * The instance of `Applicative` for `These<A, _>` from `SemiGroup` for `A`.
 */
export const app = <A>(
    semi: SemiGroup<A>,
): Applicative<Apply2Only<TheseHkt, A>> => ({
    map,
    pure: newThat,
    apply: apply(semi),
});

/**
 * The instance of `Monad` for `These<A, _>` from `SemiGroup` for `A`.
 */
export const monad = <A>(
    semi: SemiGroup<A>,
): Monad<Apply2Only<TheseHkt, A>> => ({
    ...app(semi),
    flatMap: flatMap(semi),
});

const VARIANTS = ["This", "That", "Both"] as const;

export const serialize =
    <A>(serializeA: Serialize<A>) =>
    <B>(serializeB: Serialize<B>): Serialize<These<A, B>> =>
    <S>(v: These<A, B>) =>
    (ser: Serializer<S>): Serial<S> =>
        isThis(v)
            ? doT(serializeMonad<S>())
                .addM(
                    "serVariant",
                    ser.serializeTupleVariant("These", 0, VARIANTS[0], 1),
                )
                .addMWith(
                    "_",
                    ({ serVariant }) =>
                        serVariant.serializeElement(serializeA)(v[1]),
                ).addMWith(
                    "end",
                    ({ serVariant }) => serVariant.end(),
                )
                .finish(({ end }) => end) as Serial<S>
            : isThat(v)
            ? doT(serializeMonad<S>())
                .addM(
                    "serVariant",
                    ser.serializeTupleVariant("These", 1, VARIANTS[1], 1),
                )
                .addMWith(
                    "_",
                    ({ serVariant }) =>
                        serVariant.serializeElement(serializeB)(v[1]),
                ).addMWith("end", ({ serVariant }) => serVariant.end())
                .finish(({ end }) => end) as Serial<S>
            : doT(serializeMonad<S>())
                .addM(
                    "serVariant",
                    ser.serializeTupleVariant("These", 2, VARIANTS[2], 2),
                )
                .addMWith(
                    "_",
                    ({ serVariant }) =>
                        serVariant.serializeElement(serializeA)(v[1]),
                ).addMWith(
                    "_",
                    ({ serVariant }) =>
                        serVariant.serializeElement(serializeB)(v[2]),
                ).addMWith("end", ({ serVariant }) => serVariant.end())
                .finish(({ end }) => end) as Serial<S>;

export const visitor =
    <A>(deserializeA: Deserialize<A>) =>
    <B>(deserializeB: Deserialize<B>): Visitor<These<A, B>> =>
        newVisitor("These")({
            visitVariants: (variants) => {
                const m = visitorMonad<These<A, B>>();
                return doT(m)
                    .addM(
                        "variant",
                        variants.variant(variantsDeserialize(VARIANTS)),
                    )
                    .finishM((
                        { variant: [key, access] },
                    ): VisitorRet<These<A, B>> =>
                        key === "This"
                            ? m.map(newThis<A>)(
                                access.visitCustom(deserializeA),
                            )
                            : key === "That"
                            ? m.map(newThat<B>)(
                                access.visitCustom(deserializeB),
                            )
                            : doT(m)
                                .addM("left", access.visitCustom(deserializeA))
                                .addM("right", access.visitCustom(deserializeB))
                                .finish(({ left, right }) =>
                                    newBoth(left)(right)
                                )
                    );
            },
        });

export const deserialize =
    <A>(deserializeA: Deserialize<A>) =>
    <B>(deserializeB: Deserialize<B>): Deserialize<These<A, B>> =>
    (de) =>
        de.deserializeVariants("These")(VARIANTS)(
            visitor(deserializeA)(deserializeB),
        );

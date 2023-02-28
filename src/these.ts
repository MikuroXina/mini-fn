import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.js";
import { id } from "./identity.js";
import { List, appendToHead, either, empty } from "./list.js";
import { Tuple, make as makeTuple } from "./tuple.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import { Eq, eqSymbol } from "./type-class/eq.js";
import type { Foldable } from "./type-class/foldable.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { PartialEq } from "./type-class/partial-eq.js";
import type { SemiGroup } from "./type-class/semi-group.js";

const thisSymbol = Symbol("TheseThis");
export type This<A> = readonly [typeof thisSymbol, A];
export const newThis = <A>(a: A): This<A> => [thisSymbol, a];
export const isThis = <A, B>(these: These<A, B>): these is This<A> => these[0] === thisSymbol;

const thatSymbol = Symbol("TheseThat");
export type That<B> = readonly [typeof thatSymbol, B];
export const newThat = <B>(b: B): That<B> => [thatSymbol, b];
export const isThat = <A, B>(these: These<A, B>): these is That<B> => these[0] === thatSymbol;

const bothSymbol = Symbol("TheseBoth");
export type Both<A, B> = readonly [typeof bothSymbol, A, B];
export const newBoth =
    <A>(a: A) =>
    <B>(b: B): Both<A, B> =>
        [bothSymbol, a, b];
export const isBoth = <A, B>(these: These<A, B>): these is Both<A, B> => these[0] === bothSymbol;

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
export const eq = <A, B>(equalityA: Eq<A>, equalityB: Eq<B>): Eq<These<A, B>> => ({
    ...partialEq(equalityA, equalityB),
    [eqSymbol]: true,
});

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

export const intoTuple =
    <A>(defaultA: A) =>
    <B>(defaultB: B): ((t: These<A, B>) => Tuple<A, B>) =>
        these((a: A) => makeTuple(a)(defaultB))(makeTuple(defaultA)<B>)(makeTuple);

export const biMap =
    <A, B>(first: (a: A) => B) =>
    <C, D>(second: (c: C) => D): ((curr: These<A, C>) => These<B, D>) =>
        these((a: A) => newThis(first(a)) as These<B, D>)(
            (c: C) => newThat(second(c)) as These<B, D>,
        )((a) => (c) => newBoth(first(a))(second(c)) as These<B, D>);

export const merge = <A>(merger: (thisA: A) => (thatA: A) => A): ((t: These<A, A>) => A) =>
    these(id<A>)(id<A>)(merger);

export const mergeWith =
    <A, C>(f: (a: A) => C) =>
    <B>(g: (b: B) => C) =>
    (merger: (thisC: C) => (thatC: C) => C) =>
    (t: These<A, B>): C =>
        merge(merger)(biMap(f)(g)(t));

export const partition = <A, B>(list: List<These<A, B>>): [List<A>, List<B>, List<Tuple<A, B>>] =>
    either<[List<A>, List<B>, List<Tuple<A, B>>]>(() => [empty(), empty(), empty()])(
        (t: These<A, B>, ts: List<These<A, B>>) => {
            const [restThis, restThat, restBoth] = partition(ts);
            return these<A, [List<A>, List<B>, List<Tuple<A, B>>]>((a) => [
                appendToHead(a)(restThis),
                restThat,
                restBoth,
            ])<B>((b) => [restThis, appendToHead(b)(restThat), restBoth])((a) => (b) => [
                restThis,
                restThat,
                appendToHead(makeTuple(a)(b))(restBoth),
            ])(t);
        },
    )(list);

export const partitionHere = <A, B>(list: List<These<A, B>>): [List<A>, List<B>] =>
    either<[List<A>, List<B>]>(() => [empty(), empty()])(
        (t: These<A, B>, ts: List<These<A, B>>) => {
            const [restThis, restThat] = partitionHere(ts);
            return these<A, [List<A>, List<B>]>((a) => [appendToHead(a)(restThis), restThat])<B>(
                (b) => [restThis, appendToHead(b)(restThat)],
            )((a) => (b) => [appendToHead(a)(restThis), appendToHead(b)(restThat)])(t);
        },
    )(list);

export const distributeTheseTuple = <A, B, C>(
    t: These<Tuple<A, B>, C>,
): Tuple<These<A, C>, These<B, C>> =>
    these<Tuple<A, B>, Tuple<These<A, C>, These<B, C>>>(([a, b]) =>
        makeTuple(newThis(a))(newThis(b)),
    )<C>((c) => makeTuple(newThat(c))(newThat(c)))(
        ([a, b]) =>
            (c) =>
                makeTuple(newBoth(a)(c))(newBoth(b)(c)),
    )(t);

export const undistributeTheseTuple = <A, B, C>([t1, t2]: Tuple<These<A, C>, These<B, C>>): These<
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

export const distributeTupleThese = <A, B, C>([t, c]: Tuple<These<A, B>, C>): These<
    Tuple<A, C>,
    Tuple<B, C>
> =>
    these<A, These<Tuple<A, C>, Tuple<B, C>>>((a) => newThis(makeTuple(a)(c)))<B>((b) =>
        newThat(makeTuple(b)(c)),
    )((a) => (b) => newBoth(makeTuple(a)(c))(makeTuple(b)(c)))(t);

export const undistributeTupleThese = <A, B, C>(
    t: These<Tuple<A, C>, Tuple<B, C>>,
): Tuple<These<A, B>, C> =>
    these<Tuple<A, C>, Tuple<These<A, B>, C>>(([a, c]) => makeTuple(newThis(a))(c))<Tuple<B, C>>(
        ([b, c]) => makeTuple(newThat(b))(c),
    )(
        ([a, c]) =>
            ([b]) =>
                makeTuple(newBoth(a)(b))(c),
    )(t);

export const combine =
    <A, B>(semiA: SemiGroup<A>, semiB: SemiGroup<B>) =>
    (l: These<A, B>, r: These<A, B>): These<A, B> => {
        if (isThis(l)) {
            const leftA = l[1];
            return these<A, These<A, B>>((rightA) => newThis(semiA.combine(leftA, rightA)))<B>(
                (rightB) => newBoth(leftA)(rightB),
            )((rightA) => (rightB) => newBoth(semiA.combine(leftA, rightA))(rightB))(r);
        }
        if (isThat(l)) {
            const leftB = l[1];
            return these<A, These<A, B>>((rightA) => newBoth(rightA)(leftB))<B>((rightB) =>
                newThat(semiB.combine(leftB, rightB)),
            )((rightA) => (rightB) => newBoth(rightA)(semiB.combine(leftB, rightB)))(r);
        }
        const [, leftA, leftB] = l;
        return these<A, These<A, B>>((rightA) => newBoth(semiA.combine(leftA, rightA))(leftB))<B>(
            (rightB) => newBoth(leftA)(semiB.combine(leftB, rightB)),
        )(
            (rightA) => (rightB) =>
                newBoth(semiA.combine(leftA, rightA))(semiB.combine(leftB, rightB)),
        )(r);
    };

export const map =
    <B, C>(fn: (b: B) => C) =>
    <A>(t: These<A, B>): These<A, C> =>
        these<A, These<A, C>>((a) => newThis(a))<B>((b) => newThat(fn(b)))(
            (a) => (b) => newBoth(a)(fn(b)),
        )(t);

export const foldR =
    <A, B>(folder: (a: A) => (b: B) => B) =>
    (init: B) =>
    <X>(data: These<X, A>): B =>
        these<X, B>(() => init)<A>((a) => folder(a)(init))(() => (a) => folder(a)(init))(data);

export const traverse =
    <F extends Hkt1>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    <X>(data: These<X, A>): Get1<F, These<X, B>> =>
        these<X, Get1<F, These<X, B>>>((x) => app.pure(newThis(x)))<A>((b) =>
            app.map(newThat)(visitor(b)),
        )((x) => (b) => app.map(newBoth(x))(visitor(b)))(data);

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

export const semiGroup = <A, B>(
    semiA: SemiGroup<A>,
    semiB: SemiGroup<B>,
): SemiGroup<These<A, B>> => ({
    combine: combine(semiA, semiB),
});

export const functor: Functor<TheseHkt> = { map };

export const foldable: Foldable<TheseHkt> = { foldR };

export const bifunctor: Bifunctor<TheseHkt> = { biMap };

export const app = <A>(semi: SemiGroup<A>): Applicative<Apply2Only<TheseHkt, A>> => ({
    map,
    pure: newThat,
    apply: apply(semi),
});

export const monad = <A>(semi: SemiGroup<A>): Monad<Apply2Only<TheseHkt, A>> => ({
    ...app(semi),
    flatMap: flatMap(semi),
});

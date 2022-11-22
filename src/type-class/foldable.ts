import * as List from "../list";
import * as Option from "../option";

import type { GetHktA1, GetHktA2 } from "../hkt";
import { andMonoid, orMonoid } from "../bool";
import { compose, oneShot } from "../func";

import { Monoid } from "../type-class";
import type { PartialEq } from "./eq";

export interface Foldable1<T> {
    foldR<A, B>(folder: (a: A) => (b: B) => B): (init: B) => (data: GetHktA1<T, A>) => B;
}

export interface Foldable2<T> {
    foldR<X, A, B>(folder: (a: A) => (b: B) => B): (init: B) => (data: GetHktA2<T, X, A>) => B;
}

export const foldMap =
    <T, A, M>(foldable: Foldable1<T>, monoid: Monoid.Monoid<M>) =>
    (f: (t: A) => M): ((ta: GetHktA1<T, A>) => M) =>
        foldable.foldR<A, M>(compose(Monoid.append(monoid))(f))(monoid.identity);

export const fold = <T, M>(
    foldable: Foldable1<T>,
    monoid: Monoid.Monoid<M>,
): ((tm: GetHktA1<T, M>) => M) => foldMap<T, M, M>(foldable, monoid)((x) => x);

export const foldL =
    <T>(foldable: Foldable1<T>) =>
    <A, B>(f: (b: B) => (a: A) => B) =>
    (init: B) =>
    (data: GetHktA1<T, A>): B =>
        foldable.foldR((x: A) => (k: (b: B) => B) => oneShot((z: B) => k(f(z)(x))))((x: B): B => x)(
            data,
        )(init);

export const foldR1 =
    <T>(foldable: Foldable1<T>) =>
    <A>(f: (l: A) => (r: A) => A) =>
    (data: GetHktA1<T, A>): A => {
        const mf =
            (x: A) =>
            (m: Option.Option<A>): Option.Option<A> => {
                if (Option.isNone(m)) {
                    return Option.some(x);
                }
                return Option.some(f(x)(m[1]));
            };
        return Option.unwrapOrElse<A>(() => {
            throw new Error("foldR1: empty structure");
        })(foldable.foldR(mf)(Option.none())(data));
    };

export const foldL1 =
    <T>(foldable: Foldable1<T>) =>
    <A>(f: (l: A) => (r: A) => A) =>
    (data: GetHktA1<T, A>): A => {
        const mf =
            (m: Option.Option<A>) =>
            (y: A): Option.Option<A> => {
                if (Option.isNone(m)) {
                    return Option.some(y);
                }
                return Option.some(f(m[1])(y));
            };
        return Option.unwrapOrElse<A>(() => {
            throw new Error("foldR1: empty structure");
        })(foldL(foldable)(mf)(Option.none())(data));
    };

export const toList =
    <T>(foldable: Foldable1<T>) =>
    <A>(data: GetHktA1<T, A>): List.List<A> =>
        List.build(
            <B>(c: (a: A) => (b: B) => B) =>
                (n: B) =>
                    foldable.foldR(c)(n)(data),
        );

export const isNull = <T, A>(foldable: Foldable1<T>): ((ta: GetHktA1<T, A>) => boolean) =>
    foldable.foldR<A, boolean>(() => () => false)(true);

export const length = <T, A>(foldable: Foldable1<T>): ((ta: GetHktA1<T, A>) => number) =>
    foldL(foldable)<A, number>((c: number) => () => c + 1)(0);

export const and = <T>(foldable: Foldable1<T>): ((list: GetHktA1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a && b)(true);

export const all =
    <T>(foldable: Foldable1<T>) =>
    <A>(f: (a: A) => boolean): ((list: GetHktA1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, andMonoid)(f);

export const or = <T>(foldable: Foldable1<T>): ((list: GetHktA1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a || b)(false);

export const any =
    <T>(foldable: Foldable1<T>) =>
    <A>(f: (a: A) => boolean): ((list: GetHktA1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, orMonoid)(f);

export const contains = <T, A>(
    foldable: Foldable1<T>,
    eq: PartialEq<A, A>,
): ((target: A) => (ta: GetHktA1<T, A>) => boolean) =>
    compose<(a: A) => boolean, (list: GetHktA1<T, A>) => boolean>(any(foldable))(
        (l: A) => (r: A) => eq.eq(l, r),
    );

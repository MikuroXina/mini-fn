import { andMonoid, orMonoid } from "../bool.js";
import { compose, id } from "../func.js";
import type { Get1 } from "../hkt.js";
import { List, build } from "../list.js";
import { Option, isNone, none, some, unwrapOrElse } from "../option.js";
import { Monoid, append } from "./monoid.js";
import type { PartialEq } from "./partial-eq.js";

export interface Foldable<T> {
    readonly foldR: <A, B>(folder: (a: A) => (b: B) => B) => (init: B) => (data: Get1<T, A>) => B;
}

export const foldMap =
    <T, A, M>(foldable: Foldable<T>, monoid: Monoid<M>) =>
    (f: (t: A) => M): ((ta: Get1<T, A>) => M) =>
        foldable.foldR<A, M>(compose(append(monoid))(f))(monoid.identity);

export const fold = <T, M>(foldable: Foldable<T>, monoid: Monoid<M>): ((tm: Get1<T, M>) => M) =>
    foldMap<T, M, M>(foldable, monoid)((x) => x);

export const foldL =
    <T>(foldable: Foldable<T>) =>
    <A, B>(f: (b: B) => (a: A) => B) =>
    (init: B) =>
    (data: Get1<T, A>): B =>
        foldable.foldR((x: A) => (k: (b: B) => B) => (z: B) => k(f(z)(x)))(id)(data)(init);

export const foldR1 =
    <T>(foldable: Foldable<T>) =>
    <A>(f: (l: A) => (r: A) => A) =>
    (data: Get1<T, A>): A => {
        const mf =
            (x: A) =>
            (m: Option<A>): Option<A> => {
                if (isNone(m)) {
                    return some(x);
                }
                return some(f(x)(m[1]));
            };
        return unwrapOrElse<A>(() => {
            throw new Error("foldR1: empty structure");
        })(foldable.foldR(mf)(none())(data));
    };

export const foldL1 =
    <T>(foldable: Foldable<T>) =>
    <A>(f: (l: A) => (r: A) => A) =>
    (data: Get1<T, A>): A => {
        const mf =
            (m: Option<A>) =>
            (y: A): Option<A> => {
                if (isNone(m)) {
                    return some(y);
                }
                return some(f(m[1])(y));
            };
        return unwrapOrElse<A>(() => {
            throw new Error("foldR1: empty structure");
        })(foldL(foldable)(mf)(none())(data));
    };

export const toList =
    <T>(foldable: Foldable<T>) =>
    <A>(data: Get1<T, A>): List<A> =>
        build(
            <B>(c: (a: A) => (b: B) => B) =>
                (n: B) =>
                    foldable.foldR(c)(n)(data),
        );

export const isNull = <T, A>(foldable: Foldable<T>): ((ta: Get1<T, A>) => boolean) =>
    foldable.foldR<A, boolean>(() => () => false)(true);

export const length = <T, A>(foldable: Foldable<T>): ((ta: Get1<T, A>) => number) =>
    foldL(foldable)<A, number>((c: number) => () => c + 1)(0);

export const and = <T>(foldable: Foldable<T>): ((list: Get1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a && b)(true);

export const all =
    <T>(foldable: Foldable<T>) =>
    <A>(f: (a: A) => boolean): ((list: Get1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, andMonoid)(f);

export const or = <T>(foldable: Foldable<T>): ((list: Get1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a || b)(false);

export const any =
    <T>(foldable: Foldable<T>) =>
    <A>(f: (a: A) => boolean): ((list: Get1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, orMonoid)(f);

export const contains = <T, A>(
    foldable: Foldable<T>,
    eq: PartialEq<A>,
): ((target: A) => (ta: Get1<T, A>) => boolean) =>
    compose<(a: A) => boolean, (list: Get1<T, A>) => boolean>(any(foldable))(
        (l: A) => (r: A) => eq.eq(l, r),
    );

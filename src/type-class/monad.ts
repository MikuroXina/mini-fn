import * as Identity from "../identity";

import type {
    Applicative,
    Applicative1,
    Applicative2,
    Applicative2Monoid,
    Applicative3,
    Applicative4,
} from "./applicative";
import type { FlatMap, FlatMap1, FlatMap2, FlatMap2Monoid, FlatMap3, FlatMap4 } from "./flat-map";
import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "../hkt";

import { id } from "../func";

export interface Monad<S extends symbol> extends Applicative<S>, FlatMap<S> {}

export interface Monad1<S> extends Applicative1<S>, FlatMap1<S> {}
export interface Monad2<S> extends Applicative2<S>, FlatMap2<S> {}
export interface Monad2Monoid<S, M> extends Applicative2Monoid<S, M>, FlatMap2Monoid<S, M> {}
export interface Monad3<S> extends Applicative3<S>, FlatMap3<S> {}
export interface Monad4<S> extends Applicative4<S>, FlatMap4<S> {}

export function flat<S>(m: Monad1<S>): <A>(a: GetHktA1<S, GetHktA1<S, A>>) => GetHktA1<S, A>;
export function flat<S>(
    m: Monad2<S>,
): <B, A>(a: GetHktA2<S, B, GetHktA2<S, B, A>>) => GetHktA2<S, B, A>;
export function flat<S, M>(
    m: Monad2Monoid<S, M>,
): <A>(a: GetHktA2<S, M, GetHktA2<S, M, A>>) => GetHktA2<S, M, A>;
export function flat<S>(
    m: Monad3<S>,
): <C, B, A>(a: GetHktA3<S, C, B, GetHktA3<S, C, B, A>>) => GetHktA3<S, C, B, A>;
export function flat<S>(
    m: Monad4<S>,
): <D, C, B, A>(a: GetHktA4<S, D, C, B, GetHktA4<S, D, C, B, A>>) => GetHktA4<S, D, C, B, A>;
export function flat<S extends symbol>(m: Monad<S>): <A>(a: Hkt<S, Hkt<S, A>>) => Hkt<S, A> {
    return m.flatMap(id);
}

export function begin<S>(m: Monad1<S>): GetHktA1<S, object>;
export function begin<S, T>(m: Monad2<S>): GetHktA2<S, T, object>;
export function begin<S, T, U>(m: Monad3<S>): GetHktA3<S, T, U, object>;
export function begin<S, T, U, V>(m: Monad4<S>): GetHktA4<S, T, U, V, object>;
export function begin<S extends symbol>(m: Monad<S>): Hkt<S, object> {
    return m.pure({});
}

export type Append<A extends object, NK extends PropertyKey, B> = A & {
    readonly [K in keyof A | NK]: K extends keyof A ? A[K] : B;
};

export function bindT<S>(
    m: Monad1<S>,
): <B>(
    f: () => GetHktA1<S, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA1<S, A>) => GetHktA1<S, Append<A, NK, B>>;
export function bindT<S>(
    m: Monad2<S>,
): <B, T>(
    f: () => GetHktA2<S, T, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA2<S, T, A>) => GetHktA2<S, T, Append<A, NK, B>>;
export function bindT<S>(
    m: Monad3<S>,
): <B, T, U>(
    f: () => GetHktA3<S, T, U, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA3<S, T, U, A>) => GetHktA3<S, T, U, Append<A, NK, B>>;
export function bindT<S>(
    m: Monad4<S>,
): <B, T, U, V>(
    f: () => GetHktA4<S, T, U, V, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA4<S, T, U, V, A>) => GetHktA4<S, T, U, V, Append<A, NK, B>>;
export function bindT<S extends symbol>(
    m: Monad<S>,
): <B>(
    f: () => Hkt<S, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: Hkt<S, A>) => Hkt<S, Append<A, NK, B>> {
    return <B>(f: () => Hkt<S, B>) =>
        <NK extends PropertyKey>(name: NK) =>
        <A extends object>(ma: Hkt<S, A>) =>
            m.flatMap(
                (a: A): Hkt<S, Append<A, NK, B>> =>
                    m.map((b: B): Append<A, NK, B> => ({ ...a, [name]: b } as Append<A, NK, B>))(
                        f(),
                    ),
            )(ma);
}

export const bind = bindT(Identity.monad);

export function kleisli<S>(
    monad: Monad1<S>,
): <A, B>(
    f: (a: A) => GetHktA1<S, B>,
) => <C>(g: (b: B) => GetHktA1<S, C>) => (a: A) => GetHktA1<S, C>;
export function kleisli<S, T>(
    monad: Monad2<S>,
): <A, B>(
    f: (a: A) => GetHktA2<S, T, B>,
) => <C>(g: (b: B) => GetHktA2<S, T, C>) => (a: A) => GetHktA2<S, T, C>;
export function kleisli<S, T>(
    monad: Monad2Monoid<S, T>,
): <A, B>(
    f: (a: A) => GetHktA2<S, T, B>,
) => <C>(g: (b: B) => GetHktA2<S, T, C>) => (a: A) => GetHktA2<S, T, C>;
export function kleisli<S, T, U>(
    monad: Monad3<S>,
): <A, B>(
    f: (a: A) => GetHktA3<S, T, U, B>,
) => <C>(g: (b: B) => GetHktA3<S, T, U, C>) => (a: A) => GetHktA3<S, T, U, C>;
export function kleisli<S, T, U, V>(
    monad: Monad4<S>,
): <A, B>(
    f: (a: A) => GetHktA4<S, T, U, V, B>,
) => <C>(g: (b: B) => GetHktA4<S, T, U, V, C>) => (a: A) => GetHktA4<S, T, U, V, C>;
export function kleisli<S extends symbol>(
    monad: Monad<S>,
): <A, B>(f: (a: A) => Hkt<S, B>) => <C>(g: (b: B) => Hkt<S, C>) => (a: A) => Hkt<S, C> {
    return (f) => (g) => (x) => monad.flatMap(g)(f(x));
}

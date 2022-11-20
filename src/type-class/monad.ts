import type {
    Applicative,
    Applicative1,
    Applicative2,
    Applicative2Monoid,
    Applicative3,
    Applicative4,
} from "./applicative";
import type { FlatMap, FlatMap1, FlatMap2, FlatMap2Monoid, FlatMap3, FlatMap4 } from "./flat-map";
import type {
    GetHktA1,
    GetHktA2,
    GetHktA3,
    GetHktA4,
    Hkt,
    HktKeyA1,
    HktKeyA2,
    HktKeyA3,
    HktKeyA4,
} from "../hkt";

import { Identity } from "../lib";

export interface Monad<S extends symbol> extends Applicative<S>, FlatMap<S> {}

export interface Monad1<S extends HktKeyA1> extends Applicative1<S>, FlatMap1<S> {}
export interface Monad2<S extends HktKeyA2> extends Applicative2<S>, FlatMap2<S> {}
export interface Monad2Monoid<S extends HktKeyA2, M>
    extends Applicative2Monoid<S, M>,
        FlatMap2Monoid<S, M> {}
export interface Monad3<S extends HktKeyA3> extends Applicative3<S>, FlatMap3<S> {}
export interface Monad4<S extends HktKeyA4> extends Applicative4<S>, FlatMap4<S> {}

export function begin<S extends HktKeyA1>(m: Monad1<S>): GetHktA1<S, object>;
export function begin<S extends HktKeyA2, T>(m: Monad2<S>): GetHktA2<S, T, object>;
export function begin<S extends HktKeyA3, T, U>(m: Monad3<S>): GetHktA3<S, T, U, object>;
export function begin<S extends HktKeyA4, T, U, V>(m: Monad4<S>): GetHktA4<S, T, U, V, object>;
export function begin<S extends symbol>(m: Monad<S>): Hkt<S, object> {
    return m.pure({});
}

export type Append<A extends object, NK extends PropertyKey, B> = A & {
    readonly [K in keyof A | NK]: K extends keyof A ? A[K] : B;
};

export function bindT<S extends HktKeyA1>(
    m: Monad1<S>,
): <B>(
    f: () => GetHktA1<S, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA1<S, A>) => GetHktA1<S, Append<A, NK, B>>;
export function bindT<S extends HktKeyA2>(
    m: Monad2<S>,
): <B, T>(
    f: () => GetHktA2<S, T, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA2<S, T, A>) => GetHktA2<S, T, Append<A, NK, B>>;
export function bindT<S extends HktKeyA3>(
    m: Monad3<S>,
): <B, T, U>(
    f: () => GetHktA3<S, T, U, B>,
) => <NK extends PropertyKey>(
    name: NK,
) => <A extends object>(ma: GetHktA3<S, T, U, A>) => GetHktA3<S, T, U, Append<A, NK, B>>;
export function bindT<S extends HktKeyA4>(
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

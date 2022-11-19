import type {
    Applicative,
    Applicative1,
    Applicative2,
    Applicative2Monoid,
    Applicative3,
    Applicative4,
} from "./applicative";
import type { FlatMap, FlatMap1, FlatMap2, FlatMap2Monoid, FlatMap3, FlatMap4 } from "./flat-map";
import type { Hkt, HktKeyA1, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";

export interface Monad<S extends symbol> extends Applicative<S>, FlatMap<S> {}

export interface Monad1<S extends HktKeyA1> extends Applicative1<S>, FlatMap1<S> {}
export interface Monad2<S extends HktKeyA2> extends Applicative2<S>, FlatMap2<S> {}
export interface Monad2Monoid<S extends HktKeyA2, M>
    extends Applicative2Monoid<S, M>,
        FlatMap2Monoid<S, M> {}
export interface Monad3<S extends HktKeyA3> extends Applicative3<S>, FlatMap3<S> {}
export interface Monad4<S extends HktKeyA4> extends Applicative4<S>, FlatMap4<S> {}

export type Append<A, NK extends PropertyKey, B> = {
    readonly [K in keyof A | NK]: K extends keyof A ? A[K] : B;
};

export const bind =
    <S extends symbol>(m: Monad<S>) =>
    <A, B>(f: (a: A) => Hkt<S, B>) =>
    <NK extends PropertyKey>(name: Exclude<NK, keyof A>) =>
    (ma: Hkt<S, A>): Hkt<S, Append<A, NK, B>> =>
        m.flatMap(
            (a: A): Hkt<S, Append<A, NK, B>> =>
                m.map((b: B): Append<A, NK, B> => ({ ...a, [name]: b } as Append<A, NK, B>))(f(a)),
        )(ma);

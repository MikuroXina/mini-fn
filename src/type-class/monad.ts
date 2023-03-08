import { id, pipe } from "../func.js";
import type { Get1 } from "../hkt.js";
import { monad as idMonad } from "../identity.js";
import type { Applicative } from "./applicative.js";
import type { FlatMap } from "./flat-map.js";

export interface Monad<S> extends Applicative<S>, FlatMap<S> {}

export const flat = <S>(m: Monad<S>): (<A>(a: Get1<S, Get1<S, A>>) => Get1<S, A>) => m.flatMap(id);

export const liftM = <S>(m: Monad<S>): (<A, B>(f: (a: A) => B) => (ma: Get1<S, A>) => Get1<S, B>) =>
    m.map;

export const begin = <S>(m: Monad<S>): Get1<S, object> => m.pure({});

export type Append<A extends object, NK extends PropertyKey, B> = A & {
    readonly [K in keyof A | NK]: K extends keyof A ? A[K] : B;
};

export const bindT =
    <S>(m: Monad<S>) =>
    <B>(f: () => Get1<S, B>) =>
    <NK extends PropertyKey>(
        name: NK,
    ): (<A extends object>(ma: Get1<S, A>) => Get1<S, Append<A, NK, B>>) =>
        m.flatMap(
            <A extends object>(a: A): Get1<S, Append<A, NK, B>> =>
                m.map((b: B): Append<A, NK, B> => ({ ...a, [name]: b } as Append<A, NK, B>))(f()),
        );

export const bind = bindT(idMonad);

export const kleisli =
    <S>(monad: Monad<S>) =>
    <A, B>(f: (a: A) => Get1<S, B>) =>
    <C>(g: (b: B) => Get1<S, C>): ((a: A) => Get1<S, C>) =>
        pipe(f)(monad.flatMap(g));

import type { GetHktA1, HktKeyA1 } from "./hkt";
import { Identity } from "./lib";
import type { Functor2 } from "./type-class/functor";
import type { Monad1, Monad2, Monad2Monoid } from "./type-class/monad";
import { Monoid } from "./type-class/monoid";

declare const writerNominal: unique symbol;
export type WriterHktKey = typeof writerNominal;

export interface Writer<out W, out A> {
    (): [A, W];
}

export const evaluate = <W, A>(w: Writer<W, A>): A => w()[0];
export const execute = <W, A>(w: Writer<W, A>): W => w()[1];

export const tellM =
    <W, S extends HktKeyA1>(w: W, m: Monad1<S>): Writer<W, GetHktA1<S, []>> =>
    () =>
        [m.pure([]), w];
export const tell = <W>(w: W): Writer<W, []> =>
    tellM<W, Identity.IdentityHktKey>(w, Identity.monad);
export const listenM =
    <S extends HktKeyA1>(m: Monad1<S>) =>
    <W, A>(a: GetHktA1<S, Writer<W, A>>): GetHktA1<S, [A, W]> =>
        m.map((writer: Writer<W, A>) => writer())(a);
export const listen = <W, A>(): ((w: Writer<W, A>) => [A, W]) =>
    listenM<Identity.IdentityHktKey>(Identity.monad);
export const pass =
    <W, A>(w: Writer<W, [A, (w: W) => W]>): Writer<W, A> =>
    () => {
        const [[ans, fn], write] = w();
        return [ans, fn(write)];
    };
export const listens =
    <W, B>(f: (w: W) => B) =>
    <A>(w: Writer<W, A>): Writer<W, [A, B]> =>
    () => {
        const [ans, write] = w();
        return [[ans, f(write)], write];
    };
export const censor =
    <W>(f: (w: W) => W) =>
    <A>(w: Writer<W, A>): Writer<W, A> =>
    () => {
        const [ans, write] = w();
        return [ans, f(write)];
    };

export const map =
    <T, U>(f: (t: T) => U) =>
    <W>(w: Writer<W, T>): Writer<W, U> =>
    () => {
        const [ans, write] = w();
        return [f(ans), write];
    };

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [writerNominal]: Writer<A1, A2>;
    }
}

export const functor: Functor2<WriterHktKey> = { map };

export const makeMonad = <W>(monoid: Monoid<W>): Monad2Monoid<WriterHktKey, W> => ({
    pure: (a) => () => [a, monoid.identity],
    map,
    flatMap: (map) => (t) => () => {
        const [ansT, writeT] = t();
        const [ansU, writeU] = map(ansT)();
        return [ansU, monoid.combine(writeT, writeU)];
    },
    apply: (fn) => (t) => () => {
        const [map, writeT] = fn();
        const [ans, writeU] = t();
        return [map(ans), monoid.combine(writeT, writeU)];
    },
});

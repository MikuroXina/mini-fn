import * as Identity from "./identity";

import type { GetHktA1, HktKeyA1 } from "./hkt";
import type { Monad1, Monad2Monoid } from "./type-class/monad";

import type { Functor2 } from "./type-class/functor";
import type { Monoid } from "./type-class/monoid";

declare const writerNominal: unique symbol;
export type WriterHktKey = typeof writerNominal;

export interface Writer<W, A> {
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
    <W, A>(w: Writer<W, [A, (write: W) => W]>): Writer<W, A> =>
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

export const product =
    <W>(monoid: Monoid<W>) =>
    <A>(a: Writer<W, A>) =>
    <B>(b: Writer<W, B>): Writer<W, [A, B]> =>
    () => {
        const [aEval, aExec] = a();
        const [bEval, bExec] = b();
        return [[aEval, bEval], monoid.combine(aExec, bExec)];
    };
export const pure =
    <W>(monoid: Monoid<W>) =>
    <T2>(a: T2): Writer<W, T2> =>
    () =>
        [a, monoid.identity];
export const map =
    <T, U>(f: (t: T) => U) =>
    <W>(w: Writer<W, T>): Writer<W, U> =>
    () => {
        const [ans, write] = w();
        return [f(ans), write];
    };
export const flatMap =
    <W>(monoid: Monoid<W>) =>
    <T2, U2>(fn: (t: T2) => Writer<W, U2>) =>
    (t: Writer<W, T2>): Writer<W, U2> =>
    () => {
        const [ansT, writeT] = t();
        const [ansU, writeU] = fn(ansT)();
        return [ansU, monoid.combine(writeT, writeU)];
    };
export const apply =
    <W>(monoid: Monoid<W>) =>
    <T2, U2>(fn: Writer<W, (t: T2) => U2>) =>
    (t: Writer<W, T2>): Writer<W, U2> =>
    () => {
        const [mapped, writeT] = fn();
        const [ans, writeU] = t();
        return [mapped(ans), monoid.combine(writeT, writeU)];
    };

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [writerNominal]: Writer<A1, A2>;
    }
}

export const functor: Functor2<WriterHktKey> = { map };

export const makeMonad = <W>(monoid: Monoid<W>): Monad2Monoid<WriterHktKey, W> => ({
    product: product(monoid),
    pure: pure(monoid),
    map,
    flatMap: flatMap(monoid),
    apply: apply(monoid),
});

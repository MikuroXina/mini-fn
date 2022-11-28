import type * as Identity from "./identity";

import type { Monad1, Monad2Monoid } from "./type-class/monad";

import type { Functor2 } from "./type-class/functor";
import type { GetHktA1 } from "./hkt";
import type { Monoid } from "./type-class/monoid";

export interface WriterT<W, M, A> {
    (): GetHktA1<M, [A, W]>;
}

export const executeWriterT =
    <M>(monad: Monad1<M>) =>
    <W, A>(w: WriterT<W, M, A>): GetHktA1<M, W> =>
        monad.map(([, nextWriter]: [A, W]) => nextWriter)(w());
export const mapWriterT =
    <M, N, A, B, W1, W2>(fn: (maw: GetHktA1<M, [A, W1]>) => GetHktA1<N, [B, W2]>) =>
    (w: WriterT<W1, M, A>): WriterT<W2, N, B> =>
    () =>
        fn(w());

declare const writerNominal: unique symbol;
export type WriterHktKey = typeof writerNominal;

export type Writer<W, A> = WriterT<W, Identity.IdentityHktKey, A>;

export const evaluateWriter = <W, A>(w: Writer<W, A>): A => w()[0];
export const executeWriter = <W, A>(w: Writer<W, A>): W => w()[1];
export const mapWriter =
    <A, B, W1, W2>(fn: (aw: [A, W1]) => [B, W2]) =>
    (w: Writer<W1, A>): Writer<W2, B> =>
    () =>
        fn(w());

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

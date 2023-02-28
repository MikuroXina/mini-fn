import type { Apply3Only, Get1, Hkt1, Hkt3 } from "./hkt.js";
import type { IdentityHkt } from "./identity.js";
import type { Tuple } from "./tuple.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";

export interface WriterT<W, M, A> {
    (): Get1<M, [A, W]>;
}

export const executeWriterT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W, A>(w: WriterT<W, M, A>): Get1<M, W> =>
        monad.map(([, nextWriter]: [A, W]) => nextWriter)(w());
export const mapWriterT =
    <M, N, A, B, W1, W2>(fn: (maw: Get1<M, [A, W1]>) => Get1<N, [B, W2]>) =>
    (w: WriterT<W1, M, A>): WriterT<W2, N, B> =>
    () =>
        fn(w());

export const tellM =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W>(w: W): WriterT<W, M, []> =>
    () =>
        monad.pure([[], w]);
export const listenM =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W, A>(writer: WriterT<W, M, A>): WriterT<W, M, [A, W]> =>
    () =>
        monad.map(([a, w]: [A, W]): [[A, W], W] => [[a, w], w])(writer());
export const listensM =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W, B>(mapper: (w: W) => B) =>
    <A>(writer: WriterT<W, M, A>): WriterT<W, M, [A, B]> =>
    () =>
        monad.map(([a, w]: [A, W]): [[A, B], W] => [[a, mapper(w)], w])(writer());
export const passM =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W, A>(writer: WriterT<W, M, [A, (w: W) => W]>): WriterT<W, M, A> =>
    () =>
        monad.map(([[a, f], w]: [[A, (w: W) => W], W]): [A, W] => [a, f(w)])(writer());

export const censorM =
    <M extends Hkt1>(monad: Monad<M>) =>
    <W>(cense: (w: W) => W) =>
    <A>(writer: WriterT<W, M, A>): WriterT<W, M, A> =>
    () =>
        monad.map(([a, w]: [A, W]): [A, W] => [a, cense(w)])(writer());

export type Writer<W, A> = WriterT<W, IdentityHkt, A>;

export const evaluateWriter = <W, A>(w: Writer<W, A>): A => w()[0];
export const executeWriter = <W, A>(w: Writer<W, A>): W => w()[1];
export const mapWriter =
    <A, B, W1, W2>(fn: (aw: [A, W1]) => [B, W2]) =>
    (w: Writer<W1, A>): Writer<W2, B> =>
    () =>
        fn(w());

export const tell =
    <W>(w: W): Writer<W, []> =>
    () =>
        [[], w];
export const listen =
    <W, A>(writer: Writer<W, A>): Writer<W, [A, W]> =>
    () => {
        const [a, w] = writer();
        return [[a, w], w];
    };
export const listens =
    <W, B>(mapper: (w: W) => B) =>
    <A>(writer: Writer<W, A>): Writer<W, [A, B]> =>
    () => {
        const [a, w] = writer();
        return [[a, mapper(w)], w];
    };
export const pass =
    <W, A>(writer: Writer<W, [A, (w: W) => W]>): Writer<W, A> =>
    () => {
        const [[a, f], w] = writer();
        return [a, f(w)];
    };

export const censor =
    <W>(cense: (w: W) => W) =>
    <A>(writer: Writer<W, A>): Writer<W, A> =>
    () => {
        const [a, w] = writer();
        return [a, cense(w)];
    };

export const product =
    <W>(monoid: Monoid<W>) =>
    <A>(a: Writer<W, A>) =>
    <B>(b: Writer<W, B>): Writer<W, Tuple<A, B>> =>
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

export interface WriterTHkt extends Hkt3 {
    readonly type: WriterT<this["arg3"], this["arg2"], this["arg1"]>;
}

export const functor: Functor<WriterTHkt> = { map };

export const makeMonad = <W>(monoid: Monoid<W>): Monad<Apply3Only<WriterTHkt, W>> => ({
    pure: pure(monoid),
    map,
    flatMap: flatMap(monoid),
    apply: apply(monoid),
});

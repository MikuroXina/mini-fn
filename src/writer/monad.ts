import type { Get1, Hkt1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";
import type { Monoid } from "../type-class/monoid.js";

export interface MonadWriter<W, M extends Hkt1> extends Monoid<W>, Monad<M> {
    readonly tell: (output: W) => Get1<M, []>;
    readonly listen: <A>(action: Get1<M, A>) => Get1<M, [A, W]>;
    readonly pass: <A>(action: Get1<M, [A, (output: W) => W]>) => Get1<M, A>;
}

export const listens =
    <W, M extends Hkt1>(mw: MonadWriter<W, M>) =>
    <B>(f: (w: W) => B) =>
    <A>(m: Get1<M, A>): Get1<M, [A, B]> =>
        mw.map(([action, output]: [A, W]): [A, B] => [action, f(output)])(mw.listen(m));
export const censor =
    <W, M extends Hkt1>(mw: MonadWriter<W, M>) =>
    (f: (w: W) => W) =>
    <A>(m: Get1<M, A>): Get1<M, A> =>
        mw.pass(mw.map((a: A): [A, typeof f] => [a, f])(m));

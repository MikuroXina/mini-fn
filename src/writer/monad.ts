import type { GetHktA1 } from "hkt";
import type { Monad1 } from "../type-class/monad";
import type { Monoid } from "../type-class/monoid";

export interface MonadWriter<W, M> extends Monoid<W>, Monad1<M> {
    tell: (output: W) => GetHktA1<M, []>;
    listen: <A>(action: GetHktA1<M, A>) => GetHktA1<M, [A, W]>;
    pass: <A>(action: GetHktA1<M, [A, (output: W) => W]>) => GetHktA1<M, A>;
}

export const listens =
    <W, M>(mw: MonadWriter<W, M>) =>
    <B>(f: (w: W) => B) =>
    <A>(m: GetHktA1<M, A>): GetHktA1<M, [A, B]> =>
        mw.map(([action, output]: [A, W]): [A, B] => [action, f(output)])(mw.listen(m));
export const censor =
    <W, M>(mw: MonadWriter<W, M>) =>
    (f: (w: W) => W) =>
    <A>(m: GetHktA1<M, A>): GetHktA1<M, A> =>
        mw.pass(mw.map((a: A): [A, typeof f] => [a, f])(m));

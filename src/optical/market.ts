import type { Apply2Only, Apply3Only, Apply4Only, Hkt4 } from "../hkt.js";
import { err, isErr, mapErr, ok, type Result } from "../result.js";
import type { Choice } from "../type-class/choice.js";
import type { Functor } from "../type-class/functor.js";
import type { Profunctor } from "../type-class/profunctor.js";

export interface Market<A, B, S, T> {
    bt: (b: B) => T;
    sta: (s: S) => Result<T, A>;
}
export type MarketSimple<A, S, T> = Market<A, A, S, T>;

export interface MarketHkt extends Hkt4 {
    readonly type: Market<this["arg4"], this["arg3"], this["arg2"], this["arg1"]>;
}

export const map =
    <T, U>(fn: (t: T) => U) =>
    <A, B, S>(m: Market<A, B, S, T>): Market<A, B, S, U> => ({
        bt: (b) => fn(m.bt(b)),
        sta: (s) => mapErr(fn)(m.sta(s)),
    });

export const diMap =
    <R, S>(f: (r: R) => S) =>
    <T, U>(g: (t: T) => U) =>
    <A, B>(m: Market<A, B, S, T>): Market<A, B, R, U> => ({
        bt: (b) => g(m.bt(b)),
        sta: (r) => mapErr(g)(m.sta(f(r))),
    });

export const left = <A, B, S, T, X>(
    m: Market<A, B, S, T>,
): Market<A, B, Result<S, X>, Result<T, X>> => ({
    bt: (b) => err(m.bt(b)) as Result<T, X>,
    sta: (sx) => {
        if (isErr(sx)) {
            const s = sx[1];
            const ta = m.sta(s);
            return mapErr((t) => err(t) as Result<T, X>)(ta);
        }
        return err(ok(sx[1]));
    },
});

export const right = <A, B, S, T, X>(
    m: Market<A, B, S, T>,
): Market<A, B, Result<X, S>, Result<X, T>> => ({
    bt: (b) => ok(m.bt(b)) as Result<X, T>,
    sta: (xs) => {
        if (isErr(xs)) {
            return err(xs);
        }
        const ta = m.sta(xs[1]);
        return mapErr((t) => err(ok(t)) as Result<X, T>)(ta);
    },
});

export const functor = <A, B, S>(): Functor<
    Apply2Only<Apply3Only<Apply4Only<MarketHkt, A>, B>, S>
> => ({ map });

export const profunctor = <A, B>(): Profunctor<Apply3Only<Apply4Only<MarketHkt, A>, B>> => ({
    diMap,
});

export const choice = <A, B>(): Choice<Apply3Only<Apply4Only<MarketHkt, A>, B>> => ({
    diMap,
    left,
    right,
});

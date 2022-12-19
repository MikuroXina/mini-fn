import type { GetHktA1 } from "../hkt.js";

export interface Invariant<S> {
    inMap<T1, U1>(
        f: (t1: T1) => U1,
    ): (g: (u1: U1) => T1) => (st: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}

export interface Contravariant<S> {
    contraMap<T1, U1>(f: (arg: T1) => U1): (u: GetHktA1<S, U1>) => GetHktA1<S, T1>;
}

export const contraAsIn = <S>(contra: Contravariant<S>): Invariant<S> => ({
    inMap: () => contra.contraMap,
});

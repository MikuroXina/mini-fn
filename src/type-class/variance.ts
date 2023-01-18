import type { Get1, Hkt1 } from "../hkt.js";

export interface Invariant<S extends Hkt1> {
    readonly inMap: <T1, U1>(
        f: (t1: T1) => U1,
    ) => (g: (u1: U1) => T1) => (st: Get1<S, T1>) => Get1<S, U1>;
}

export interface Contravariant<S extends Hkt1> {
    readonly contraMap: <T1, U1>(f: (arg: T1) => U1) => (u: Get1<S, U1>) => Get1<S, T1>;
}

export const contraAsIn = <S extends Hkt1>(contra: Contravariant<S>): Invariant<S> => ({
    inMap: () => contra.contraMap,
});

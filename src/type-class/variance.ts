import type { GetHktA1, HktKeyA1 } from "../hkt";

export interface Invariant<S extends HktKeyA1> {
    inMap<T1, U1>(
        f: (t1: T1) => U1,
    ): (g: (u1: U1) => T1) => (st: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}

export interface Contravariant<S extends HktKeyA1> {
    contraMap<T1, U1>(f: (arg: T1) => U1): (u: GetHktA1<S, U1>) => GetHktA1<S, T1>;
}

export const contraAsIn = <S extends HktKeyA1>(contra: Contravariant<S>): Invariant<S> => ({
    inMap: () => contra.contraMap,
});

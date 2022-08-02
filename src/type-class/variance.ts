import type { HktKeyA1, GetHktA1 } from "../hkt";

export interface Contravariant<S extends HktKeyA1> {
    contraMap<T1, U1>(f: (arg: Readonly<T1>) => U1): (u: GetHktA1<S, U1>) => GetHktA1<S, T1>;
}

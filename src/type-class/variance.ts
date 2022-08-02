import type { HktKeyA1, HktDictA1 } from "../hkt";

export interface Contravariant<S extends HktKeyA1> {
    contraMap<T1, U1>(f: (arg: Readonly<T1>) => U1): (u: HktDictA1<U1>) => HktDictA1<T1>;
}

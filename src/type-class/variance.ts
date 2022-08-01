import type { HktA1, HktDictA1 } from "../hkt";

export interface Contravariant<A extends HktA1> {
    contraMap<T1, U1>(f: (arg: Readonly<T1>) => U1): (u: HktDictA1<U1>[A]) => HktDictA1<T1>[A];
}

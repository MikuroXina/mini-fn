import type { Get1, Hkt1 } from "../hkt.js";

export interface FlatMap<S extends Hkt1> {
    readonly flatMap: <T1, U1>(a: (t: T1) => Get1<S, U1>) => (t: Get1<S, T1>) => Get1<S, U1>;
}

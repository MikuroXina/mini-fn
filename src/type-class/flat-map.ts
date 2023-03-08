import type { Get1 } from "../hkt.js";

export interface FlatMap<S> {
    readonly flatMap: <T1, U1>(a: (t: T1) => Get1<S, U1>) => (t: Get1<S, T1>) => Get1<S, U1>;
}

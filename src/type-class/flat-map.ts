import type { Get1 } from "../hkt.ts";

export interface FlatMap<S> {
    readonly flatMap: <T1, U1>(
        a: (t: T1) => Get1<S, U1>,
    ) => (t: Get1<S, T1>) => Get1<S, U1>;
}

export const flatten = <S>(
    f: FlatMap<S>,
): <T>(t: Get1<S, Get1<S, T>>) => Get1<S, T> => f.flatMap((t) => t);

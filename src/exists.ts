import type { Get1 } from "./hkt.ts";

declare const existsNominal: unique symbol;
export type Exists<F> = F & { [existsNominal]: never };

export const newExists = <F, A>(item: Get1<F, A>): Exists<F> =>
    item as Exists<F>;

export const runExists = <F, R>(
    runner: <A>(item: Get1<F, A>) => R,
): (exists: Exists<F>) => R => runner as (exists: Exists<F>) => R;

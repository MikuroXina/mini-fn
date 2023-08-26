import type { Apply3Only, Hkt3 } from "../hkt.js";
import type { Indexable } from "./indexable.js";

export type Indexed<I, A, B> = (i: I) => (a: A) => B;

export interface IndexedHkt extends Hkt3 {
    readonly type: Indexed<this["arg3"], this["arg2"], this["arg1"]>;
}
export const diMap: <A, B>(
    f: (a: A) => B,
) => <C, D>(g: (c: C) => D) => <I>(m: Indexed<I, B, C>) => Indexed<I, A, D> =
    (f) => (g) => (m) => (i) => (a) =>
        g(m(i)(f(a)));

export const indexedIndexable = <I>(): Indexable<I, Apply3Only<IndexedHkt, I>> => ({
    indexed: (data) => data,
    diMap,
});

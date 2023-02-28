import type { Get1, Hkt1 } from "./hkt.js";
import type { Reduce } from "./type-class/reduce.js";

export interface ArrayHkt extends Hkt1 {
    readonly type: readonly this["arg1"][];
}

export const fromReduce =
    <F>(reduce: Reduce<F>) =>
    <A>(fa: Get1<F, A>): readonly A[] =>
        reduce.reduceL((arr: readonly A[]) => (elem: A) => [...arr, elem])([])(fa);

export const reduceR: <A, B>(reducer: (a: A) => (b: B) => B) => (fa: readonly A[]) => (b: B) => B =
    (reducer) => (as) => (b) => {
        const reversed = [...as].reverse();
        for (const a of reversed) {
            b = reducer(a)(b);
        }
        return b;
    };
export const reduceL: <A, B>(reducer: (b: B) => (a: A) => B) => (b: B) => (fa: readonly A[]) => B =
    (reducer) => (b) => (as) => {
        for (const a of as) {
            b = reducer(b)(a);
        }
        return b;
    };

export const reduce: Reduce<ArrayHkt> = {
    reduceR,
    reduceL,
};

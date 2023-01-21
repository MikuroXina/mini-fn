import type { Hkt1 } from "./hkt.js";
import type { Reduce } from "./type-class/reduce.js";

export interface ArrayHkt extends Hkt1 {
    readonly type: readonly this["arg1"][];
}

export const reduceR: <A, B>(reducer: (a: A) => (b: B) => B) => (fa: readonly A[]) => (b: B) => B =
    (reducer) => (as) => (b) => {
        for (const a of as) {
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

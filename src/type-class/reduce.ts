import type { Get1 } from "../hkt.js";

export type Reduce<F> = {
    readonly reduceR: <A, B>(
        reducer: (a: A) => (b: B) => B,
    ) => (fa: Get1<F, A>) => (b: B) => B;
    readonly reduceL: <A, B>(
        reducer: (b: B) => (a: A) => B,
    ) => (b: B) => (fa: Get1<F, A>) => B;
};

import type { Get1, Get2 } from "../hkt.js";

export type Unital<Cat, I1, I2, F> = {
    readonly introduce: Get2<Cat, I2, Get1<F, I1>>;
};

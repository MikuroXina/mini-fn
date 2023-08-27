import type { Hkt2 } from "./hkt.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Tagged<S, B> {
    readonly value: B;
}

export interface TaggedHkt extends Hkt2 {
    readonly type: Tagged<this["arg2"], this["arg1"]>;
}

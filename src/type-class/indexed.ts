import type { Hkt3 } from "src/hkt.js";

export type Indexed<I, A, B> = (i: I) => (a: A) => B;

export interface IndexedHkt extends Hkt3 {
    readonly type: Indexed<this["arg3"], this["arg2"], this["arg1"]>;
}

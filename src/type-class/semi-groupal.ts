import type { Get1, Hkt1 } from "../hkt.js";

import type { Tuple } from "../tuple.js";

export interface SemiGroupal<F extends Hkt1> {
    readonly product: <A, B>(fa: Get1<F, A>) => (fb: Get1<F, B>) => Get1<F, Tuple<A, B>>;
}

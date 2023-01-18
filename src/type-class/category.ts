import type { Get2, Hkt2 } from "../hkt.js";

import type { SemiGroupoid } from "./semi-groupoid.js";

export interface Category<S extends Hkt2> extends SemiGroupoid<S> {
    readonly identity: <A>() => Get2<S, A, A>;
}

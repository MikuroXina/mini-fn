import type { Get2 } from "../hkt.js";
import type { Associative } from "./associative.js";

export interface Symmetric<Cat, T> extends Associative<Cat, T> {
    readonly swap: <A, B>() => Get2<Cat, Get2<T, A, B>, Get2<T, B, A>>;
}

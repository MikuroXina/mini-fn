import type { Get1, Hkt1 } from "../hkt.js";

export interface Pure<S extends Hkt1> {
    readonly pure: <T>(t: T) => Get1<S, T>;
}

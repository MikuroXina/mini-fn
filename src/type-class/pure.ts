import type { Get1 } from "../hkt.ts";

export interface Pure<S> {
    readonly pure: <T>(t: T) => Get1<S, T>;
}

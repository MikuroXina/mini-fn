import type { Monoid } from "./monoid";
import { compose } from "../func";

export type Endo<T> = (t: T) => T;

export const monoid = <T>(): Monoid<Endo<T>> => ({
    identity: (x: T) => x,
    combine: (l, r) => compose(l)(r),
});

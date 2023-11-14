import { compose } from "../func.ts";
import type { Monoid } from "./monoid.ts";
import { semiGroupSymbol } from "./semi-group.ts";

export type Endo<T> = (t: T) => T;

export const monoid = <T>(): Monoid<Endo<T>> => ({
    identity: (x: T) => x,
    combine: (l, r) => compose(l)(r),
    [semiGroupSymbol]: true,
});

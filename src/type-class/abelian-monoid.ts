import type { abelSymbol } from "./abelian-group.js";
import type { Monoid } from "./monoid.js";

export type AbelianMonoid<T> = Monoid<T> & {
    [abelSymbol]: true;
};

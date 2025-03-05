import type { abelSymbol } from "./abelian-group.ts";
import type { Monoid } from "./monoid.ts";

export type AbelianMonoid<T> = Monoid<T> & {
    [abelSymbol]: true;
};

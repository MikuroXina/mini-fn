import type { abelSymbol } from "./abelian-group.ts";
import type { Monoid } from "./monoid.ts";

export interface AbelianMonoid<T> extends Monoid<T> {
    [abelSymbol]: true;
}

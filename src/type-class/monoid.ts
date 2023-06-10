import * as List from "../list.js";
import { type SemiGroup, semiGroupSymbol } from "./semi-group.js";

/**
 * All instances of `Monoid` must satisfy following conditions:
 *
 * - Associative: for all `x`, `y` and `z`; `combine(combine(x, y), z)` equals to `combine(x, combine(y, z))`.
 * - Identity: for all `x`; `combine(x, identity)` equals to `combine(identity, x)` and `x`.
 */
export interface Monoid<T> extends SemiGroup<T> {
    readonly identity: T;
}

export const append =
    <T>(monoid: Monoid<T>) =>
    (l: T) =>
    (r: T): T =>
        monoid.combine(l, r);

export const concat = <T>(monoid: Monoid<T>): ((list: List.List<T>) => T) =>
    List.foldL(append(monoid))(monoid.identity);

export const minMonoid = (infinity: number): Monoid<number> => ({
    combine(l, r) {
        return Math.min(l, r);
    },
    identity: infinity,
    [semiGroupSymbol]: true,
});

export const maxMonoid = (negativeInfinity: number): Monoid<number> => ({
    combine(l, r) {
        return Math.max(l, r);
    },
    identity: negativeInfinity,
    [semiGroupSymbol]: true,
});

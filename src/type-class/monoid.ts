import { List } from "../lib";
import type { SemiGroup } from "./semi-group";

/**
 * All instances of `Monoid` must satisfy following conditions:
 * - Associative: If `M` is a `Monoid`, for all `x`, `y` and `z`; `M.combine(M.combine(x, y), z)` equals to `M.combine(x, M.combine(y, z))`.
 * - Identity: If `M` is a `Monoid`, for all `x`; `M.combine(x, M.identity)` equals to `M.combine(M.identity, x)` and `x`.
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
});

export const maxMonoid = (negativeInfinity: number): Monoid<number> => ({
    combine(l, r) {
        return Math.max(l, r);
    },
    identity: negativeInfinity,
});

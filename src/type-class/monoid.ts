import * as List from "../list.ts";
import { type SemiGroup, semiGroupSymbol } from "./semi-group.ts";

/**
 * All instances of `Monoid` must satisfy following conditions:
 *
 * - Associative: for all `x`, `y` and `z`; `combine(combine(x, y), z)` equals to `combine(x, combine(y, z))`.
 * - Identity: for all `x`; `combine(x, identity)` equals to `combine(identity, x)` and `x`.
 */
export type Monoid<T> = SemiGroup<T> & {
    readonly identity: T;
};

export const append = <T>(monoid: Monoid<T>) => (l: T) => (r: T): T =>
    monoid.combine(l, r);

export const concat = <T>(monoid: Monoid<T>): (list: List.List<T>) => T =>
    List.foldL(append(monoid))(monoid.identity);

export const trivialMonoid: Monoid<never[]> = {
    combine: () => [],
    identity: [],
    [semiGroupSymbol]: true,
};

export const flippedMonoid = <M>(m: Monoid<M>): Monoid<M> => ({
    ...m,
    combine: (l, r) => m.combine(r, l),
});

export const addMonoid: Monoid<number> = {
    combine(l: number, r: number): number {
        return l + r;
    },
    identity: 0,
    [semiGroupSymbol]: true,
};

export const mulMonoid: Monoid<number> = {
    combine(l: number, r: number): number {
        return l * r;
    },
    identity: 1,
    [semiGroupSymbol]: true,
};

export const minMonoid = (infinity: number): Monoid<number> => ({
    combine(l, r): number {
        return Math.min(l, r);
    },
    identity: infinity,
    [semiGroupSymbol]: true,
});

export const maxMonoid = (negativeInfinity: number): Monoid<number> => ({
    combine(l, r): number {
        return Math.max(l, r);
    },
    identity: negativeInfinity,
    [semiGroupSymbol]: true,
});

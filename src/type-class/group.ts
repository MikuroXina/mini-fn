import { map, type Option, some, unwrap } from "../option.ts";
import type { Monoid } from "./monoid.ts";
import { semiGroupSymbol } from "./semi-group.ts";

/**
 * A structure of 2-term operation `combine` and 1-term operation `invert`, which must satisfy following conditions **except zero element**:
 *
 * - Associative: for all `x`, `y` and `z`; `combine(combine(x, y), z)` equals to `combine(x, combine(y, z))`.
 * - Identity: for all `x`; `combine(x, identity)` equals to `combine(identity, x)` and `x`.
 * - Inverse: for all `x`; `combine(x, invert(x))` equals to `combine(invert(x), x)` and `identity`.
 */
export interface GroupExceptZero<G> extends Monoid<G> {
    readonly invert: (g: G) => Option<G>;
}

export const subtractEZ =
    <G>(group: GroupExceptZero<G>) => (l: G) => (r: G): Option<G> =>
        map((inv: G) => group.combine(l, inv))(group.invert(r));

export const powiEZ =
    <G>(group: GroupExceptZero<G>) => (base: G) => (exp: number): Option<G> => {
        if (!Number.isInteger(exp)) {
            throw new Error("`exp` must be an integer");
        }
        const g = (x: G, n: number, c: G): G => {
            if (n % 2 === 0) {
                return g(group.combine(x, x), Math.floor(n / 2), c);
            }
            if (n === 1) {
                return group.combine(x, c);
            }
            return g(
                group.combine(x, x),
                Math.floor(n / 2),
                group.combine(x, c),
            );
        };
        const f = (x: G, n: number): G => {
            if (n % 2 === 0) {
                return f(group.combine(x, x), Math.floor(n / 2));
            }
            if (n === 1) {
                return x;
            }
            return g(group.combine(x, x), Math.floor(n / 2), x);
        };
        if (exp === 0) {
            return some(group.identity);
        }
        if (exp < 0) {
            return group.invert(f(base, -exp));
        }
        return some(f(base, exp));
    };

/**
 * A structure of 2-term operation `combine` and 1-term operation `invert`, which must satisfy following conditions:
 *
 * - Associative: for all `x`, `y` and `z`; `combine(combine(x, y), z)` equals to `combine(x, combine(y, z))`.
 * - Identity: for all `x`; `combine(x, identity)` equals to `combine(identity, x)` and `x`.
 * - Inverse: for all `x`; `combine(x, invert(x))` equals to `combine(invert(x), x)` and `identity`.
 */
export interface Group<G> extends Monoid<G> {
    readonly invert: (g: G) => G;
}

export const toGroupExceptZero = <G>(group: Group<G>): GroupExceptZero<G> => ({
    ...group,
    invert: (g) => some(group.invert(g)),
});

export const subtract = <G>(group: Group<G>) => (l: G) => (r: G): G =>
    group.combine(l, group.invert(r));

export const powi = <G>(group: Group<G>) => (base: G) => (exp: number): G =>
    unwrap(powiEZ(toGroupExceptZero(group))(base)(exp));

export const trivialGroup: Group<never[]> = {
    combine: () => [],
    identity: [],
    invert: () => [],
    [semiGroupSymbol]: true,
};

export const addGroup: Group<number> = {
    combine: (l: number, r: number) => l + r,
    identity: 0,
    invert: (x: number) => -x,
    [semiGroupSymbol]: true,
};

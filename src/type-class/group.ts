import type { Monoid } from "./monoid.js";
import { semiGroupSymbol } from "./semi-group.js";

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

export const subtract =
    <G>(group: Group<G>) =>
    (l: G) =>
    (r: G): G =>
        group.combine(l, group.invert(r));

export const powi =
    <G>(group: Group<G>) =>
    (base: G) =>
    (exp: number): G => {
        if (!Number.isInteger(exp)) {
            throw new Error("`exp` must be an integer");
        }
        const f = (base: G, exp: number): G => {
            if (exp % 2 == 0) {
                return f(group.combine(base, base), Math.floor(exp / 2));
            }
            if (exp == 1) {
                return base;
            }
            return g(group.combine(base, base), Math.floor(exp / 2), base);
        };
        const g = (base: G, exp: number, c: G): G => {
            if (exp % 2 == 0) {
                return g(group.combine(base, base), Math.floor(exp / 2), c);
            }
            if (exp == 1) {
                return group.combine(base, c);
            }
            return g(group.combine(base, base), Math.floor(exp / 2), group.combine(base, c));
        };
        if (exp == 0) {
            return group.identity;
        }
        if (exp < 0) {
            return group.invert(f(base, -exp));
        }
        return f(base, exp);
    };

export const trivialGroup: Group<[]> = {
    combine: () => [],
    identity: [],
    invert: () => [],
    [semiGroupSymbol]: true,
};

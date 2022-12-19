import type { Monoid } from "./type-class/monoid.js";

export const andMonoid: Monoid<boolean> = {
    identity: true,
    combine: (l, r) => l && r,
};
export const orMonoid: Monoid<boolean> = {
    identity: false,
    combine: (l, r) => l || r,
};

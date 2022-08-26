import type { Monoid } from "./type-class";

export const andMonoid: Monoid.Monoid<boolean> = {
    identity: true,
    combine: (l, r) => l && r,
};
export const orMonoid: Monoid.Monoid<boolean> = {
    identity: false,
    combine: (l, r) => l || r,
};

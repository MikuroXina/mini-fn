/**
 * All instances of `SemiGroup` must satisfy following conditions:
 * - Associative: If `S` is a `SemiGroup`, for all `x`, `y` and `z`, `S.combine(S.combine(x, y), z)` equals to `S.combine(x, S.combine(y, z))`.
 */
export interface SemiGroup<T> {
    combine(l: T, r: T): T;
}

export const combineAll =
    <T>(s: SemiGroup<T>) =>
    (init: T) =>
    (arr: readonly T[]) =>
        arr.reduce((elem, acc) => s.combine(elem, acc), init);

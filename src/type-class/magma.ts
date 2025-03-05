/**
 * 2-term operation with no constraints, but must be closed under `T`.
 */
export type Magma<T> = {
    readonly combine: (l: T, r: T) => T;
};

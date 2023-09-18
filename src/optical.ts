import type { Hkt2 } from "./hkt.js";
import type { Category } from "./type-class/category.js";

export interface Accessor<T, U> {
    readonly map: (source: T) => U;
    readonly update: (source: T) => (part: U) => T;
}

export const identity = <T>(): Accessor<T, T> => ({
    map: (source) => source,
    update: () => (part) => part,
});

export const concat =
    <U, V>(uvAccessor: Accessor<U, V>) =>
    <T>(tuAccessor: Accessor<T, U>): Accessor<T, V> => ({
        map: (source) => uvAccessor.map(tuAccessor.map(source)),
        update: (source) => (part) =>
            tuAccessor.update(source)(uvAccessor.update(tuAccessor.map(source))(part)),
    });

export const nth = <const I extends number, Tuple extends unknown[]>(
    index: I,
): Accessor<Tuple, Tuple[I]> => ({
    map: (source) => source[index],
    update: (source) => (part) =>
        [...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple,
});

export const key = <const K extends PropertyKey, O extends { [key in K]: unknown }>(
    k: K,
): Accessor<O, O[K]> => ({
    map: (source) => source[k],
    update: (source) => (part) => ({ ...source, [k]: part }),
});

export interface AccessorHkt extends Hkt2 {
    readonly type: Accessor<this["arg2"], this["arg1"]>;
}

export const arrow: Category<AccessorHkt> = {
    identity,
    compose: concat,
};

export interface Optical<T, Root = T> {
    readonly get: () => T;
    readonly set: (newValue: T) => Root;
    readonly focus: <U>(accessor: Accessor<T, U>) => Optical<U, Root>;
    readonly root: Root;
    readonly accessor: Accessor<Root, T>;
}

export const grow =
    <T>(data: T) =>
    <U>(next: Accessor<T, U>) =>
    <Root>(optical: Optical<T, Root>): Optical<U, Root> => ({
        get: () => next.map(data),
        set: (newValue) => optical.accessor.update(optical.root)(next.update(data)(newValue)),
        focus: <V>(accessor: Accessor<U, V>): Optical<V, Root> =>
            grow(next.map(data))(accessor)(grow(data)(next)(optical)),
        root: optical.root,
        accessor: concat(next)(optical.accessor),
    });

export const newOptical = <T>(data: T): Optical<T> => ({
    get: () => data,
    set: (newValue) => newValue,
    focus: (accessor) => grow(data)(accessor)(newOptical(data)),
    root: data,
    accessor: identity(),
});

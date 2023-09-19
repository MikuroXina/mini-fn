import type { Hkt2 } from "../hkt.js";
import type { Category } from "../type-class/category.js";

export interface Lens<T, U> {
    readonly map: (source: T) => U;
    readonly update: (source: T) => (part: U) => T;
}

export const identity = <T>(): Lens<T, T> => ({
    map: (source) => source,
    update: () => (part) => part,
});

export const concat =
    <U, V>(uvAccessor: Lens<U, V>) =>
    <T>(tuAccessor: Lens<T, U>): Lens<T, V> => ({
        map: (source) => uvAccessor.map(tuAccessor.map(source)),
        update: (source) => (part) =>
            tuAccessor.update(source)(uvAccessor.update(tuAccessor.map(source))(part)),
    });

export const nth = <const I extends number, Tuple extends unknown[]>(
    index: I,
): Lens<Tuple, Tuple[I]> => ({
    map: (source) => source[index],
    update: (source) => (part) =>
        [...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple,
});

export const key = <const K extends PropertyKey, O extends Record<K, unknown>>(
    k: K,
): Lens<O, O[K]> => ({
    map: (source) => source[k],
    update: (source) => (part) => ({ ...source, [k]: part }),
});

export type Entries<O, K> = K extends readonly [infer H, ...infer R]
    ? H extends keyof O
        ? [R] extends [[]]
            ? [[H, O[H]]]
            : [[H, O[H]], ...Entries<O, R>]
        : never
    : [PropertyKey, unknown][];

export const keys = <const K extends readonly PropertyKey[], O extends Record<K[number], unknown>>(
    keysToUpdate: K,
): Lens<O, Entries<O, K>> => ({
    map: (source) => keysToUpdate.map((k: K[number]) => [k, source[k]]) as Entries<O, K>,
    update: (source) => (parts: Entries<O, K>) => {
        const obj = { ...source } as Record<PropertyKey, unknown>;
        for (const [k, v] of parts) {
            if (Object.hasOwn(obj, k)) {
                obj[k] = v;
            }
        }
        return obj as O;
    },
});

export interface LensHkt extends Hkt2 {
    readonly type: Lens<this["arg2"], this["arg1"]>;
}

export const arrow: Category<LensHkt> = {
    identity,
    compose: concat,
};

import type { Hkt2 } from "../hkt.js";
import { type Optical, type OpticalCat, opticalCat } from "../optical.js";
import type { Category } from "../type-class/category.js";

/**
 * Transformation combinator for a data structure.
 * ```text
 * State --[ get ]--|--> Part
 *                  V
 * State <-[ set ]--O<-- Part
 * ```
 */
export type Lens<State, Part> = Optical<State, Part, Part, (state: State) => State>;

export const identity = <T>(): Lens<T, T> => ({
    get: (source) => source,
    set: (part) => () => part,
});

export const concat =
    <U, V>(uvAccessor: Lens<U, V>) =>
    <T>(tuAccessor: Lens<T, U>): Lens<T, V> => ({
        get: (source) => uvAccessor.get(tuAccessor.get(source)),
        set: (part) => (source) =>
            tuAccessor.set(uvAccessor.set(part)(tuAccessor.get(source)))(source),
    });

export const newLens = <State>(
    data: State,
): OpticalCat<void, State, void, (part: State) => State> =>
    opticalCat({
        get: () => data,
        set: () => (part) => part,
    });

export const nth = <const I extends number, Tuple extends unknown[]>(
    index: I,
): Lens<Tuple, Tuple[I]> => ({
    get: (source) => source[index],
    set: (part) => (source) =>
        [...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple,
});

export const key = <const K extends PropertyKey, O extends Record<K, unknown>>(
    k: K,
): Lens<O, O[K]> => ({
    get: (source) => source[k],
    set: (part) => (source) => ({ ...source, [k]: part }),
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
    get: (source) => keysToUpdate.map((k: K[number]) => [k, source[k]]) as Entries<O, K>,
    set: (parts: Entries<O, K>) => (source) => {
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

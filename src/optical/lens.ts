import type { Hkt2 } from "../hkt.js";
import type { Optical } from "../optical.js";
import type { Category } from "../type-class/category.js";

/**
 * Transformation combinator for a data structure.
 * ```text
 * State --[ get ]--|--> Part
 *                  V
 * Part  <-[ set ]--O<-- State
 * ```
 */
export type Lens<State, Part> = Optical<State, Part, State, (part: Part) => State>;

export const identity = <T>(): Lens<T, T> => ({
    get: (source) => source,
    set: () => (part) => part,
});

export const concat =
    <U, V>(uvAccessor: Lens<U, V>) =>
    <T>(tuAccessor: Lens<T, U>): Lens<T, V> => ({
        get: (source) => uvAccessor.get(tuAccessor.get(source)),
        set: (source) => (part) =>
            tuAccessor.set(source)(uvAccessor.set(tuAccessor.get(source))(part)),
    });

export const nth = <const I extends number, Tuple extends unknown[]>(
    index: I,
): Lens<Tuple, Tuple[I]> => ({
    get: (source) => source[index],
    set: (source) => (part) =>
        [...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple,
});

export const key = <const K extends PropertyKey, O extends Record<K, unknown>>(
    k: K,
): Lens<O, O[K]> => ({
    get: (source) => source[k],
    set: (source) => (part) => ({ ...source, [k]: part }),
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
    set: (source) => (parts: Entries<O, K>) => {
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

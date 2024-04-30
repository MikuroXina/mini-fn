/**
 * @packageDocumentation
 * Transformation combinator for a data structure.
 * ```text
 * S -----|--[ get ]-> A
 *        V
 * T <-[ set ]<------- B
 * ```
 */

import { type Optic } from "../optical.ts";

/**
 * Creates a new `Lens` optic from the two functions.
 *
 * @param get - The extraction process.
 * @param set - The overwrite process.
 * @returns The computation to focus the data.
 */
export const newLens =
    <S, A>(get: (s: S) => A) =>
    <B, T>(set: (s: S) => (b: B) => T): Optic<S, T, A, B> =>
    (next) =>
    (received) =>
    (callback) => next(get(received))((b) => callback(set(received)(b)));

/**
 * Focuses to the given index of array.
 *
 * @param index - The index of array to extract.
 * @returns The lens for indexing.
 */
export const nth = <
    const I extends number,
    Tuple extends readonly unknown[],
    V = Tuple[I],
>(
    index: I,
): Optic<Tuple, Tuple, Tuple[I], V> =>
    newLens<Tuple, Tuple[I]>((source) => source[index])(
        (source) => (part) =>
            [
                ...source.slice(0, index),
                part,
                ...source.slice(index + 1),
            ] as unknown as Tuple,
    );

/**
 * Focuses to the given key of object.
 *
 * @param k - The key of object to extract.
 * @returns The lens for indexing.
 */
export const key = <
    const K extends PropertyKey,
    O extends Readonly<Record<K, unknown>>,
    V = O[K],
>(
    k: K,
): Optic<O, O, O[K], V> =>
    newLens<O, O[K]>((source) => source[k])((source) => (part) => ({
        ...source,
        [k]: part,
    }));

export type Entries<O, K> = K extends readonly [infer H, ...infer R]
    ? H extends keyof O ? [R] extends [[]] ? [[H, O[H]]]
        : [[H, O[H]], ...Entries<O, R>]
    : never
    : [PropertyKey, unknown][];

/**
 * Focuses to the given keys of object.
 *
 * @param k - The keys array of object to extract.
 * @returns The lens for indexing.
 */
export const keys = <
    const K extends readonly PropertyKey[],
    O extends Readonly<Record<K[number], unknown>>,
>(
    keysToUpdate: K,
): Optic<O, O, Entries<O, K>, Entries<O, K>> =>
    newLens<O, Entries<O, K>>(
        (source) =>
            keysToUpdate.map((k: K[number]) => [k, source[k]]) as Entries<O, K>,
    )((source) => (parts: Entries<O, K>) => {
        const obj = { ...source } as Record<PropertyKey, unknown>;
        for (const [k, v] of parts) {
            if (Object.hasOwn(obj, k)) {
                obj[k] = v;
            }
        }
        return obj as O;
    });

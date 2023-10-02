/**
 * @packageDocumentation
 * Transformation combinator for a data structure.
 * ```text
 * S -----|--[ get ]-> A
 *        V
 * T <-[ set ]-------- B
 * ```
 */

import { type Optic } from "../optical.js";

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
    (callback) =>
        next(get(received))((b) => callback(set(received)(b)));

export type ReplacedWith<Tuple extends readonly unknown[], I extends number, V> = Omit<Tuple, I> & {
    [key in I]: V;
};

/**
 * Focuses to the given index of array.
 *
 * @param index - The index of array to extract.
 * @returns The lens for indexing.
 */
export const nth = <const I extends number, Tuple extends readonly unknown[], V>(
    index: I,
): Optic<Tuple, ReplacedWith<Tuple, I, V>, Tuple[I], V> =>
    newLens<Tuple, Tuple[I]>((source) => source[index])(
        (source) => (part) =>
            [
                ...source.slice(0, index),
                part,
                ...source.slice(index + 1),
            ] as unknown as ReplacedWith<Tuple, I, V>,
    );

/**
 * Focuses to the given key of object.
 *
 * @param k - The key of object to extract.
 * @returns The lens for indexing.
 */
export const key = <const K extends PropertyKey, O extends Readonly<Record<K, unknown>>, V>(
    k: K,
): Optic<O, O & Record<K, V>, O[K], V> =>
    newLens<O, O[K]>((source) => source[k])((source) => (part) => ({ ...source, [k]: part }));

export type Entries<O, K> = K extends readonly [infer H, ...infer R]
    ? H extends keyof O
        ? [R] extends [[]]
            ? [[H, O[H]]]
            : [[H, O[H]], ...Entries<O, R>]
        : never
    : [PropertyKey, unknown][];

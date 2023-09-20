/**
 * @packageDocumentation
 * Transformation combinator for a data structure.
 * ```text
 * S -----------|--[ get ]-> A
 *              V
 * T <-[ set ]--O<---------- B
 * ```
 */

import { type Optic } from "../optical.js";

export const newLens =
    <S, A>(get: (s: S) => A) =>
    <B, T>(set: (s: S) => (b: B) => T): Optic<S, T, A, B> =>
    (ab) =>
    (s) =>
    (tr) =>
        ab(get(s))((b) => tr(set(s)(b)));

export const nth = <const I extends number, Tuple extends unknown[]>(
    index: I,
): Optic<Tuple, Tuple, Tuple[I], Tuple[I]> =>
    newLens<Tuple, Tuple[I]>((source) => source[index])(
        (source) => (part) =>
            [...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple,
    );

export const key = <const K extends PropertyKey, O extends Record<K, unknown>>(
    k: K,
): Optic<O, O, O[K], O[K]> =>
    newLens<O, O[K]>((source) => source[k])((source) => (part) => ({ ...source, [k]: part }));

export type Entries<O, K> = K extends readonly [infer H, ...infer R]
    ? H extends keyof O
        ? [R] extends [[]]
            ? [[H, O[H]]]
            : [[H, O[H]], ...Entries<O, R>]
        : never
    : [PropertyKey, unknown][];

export const keys = <const K extends readonly PropertyKey[], O extends Record<K[number], unknown>>(
    keysToUpdate: K,
) =>
    newLens<O, Entries<O, K>>(
        (source) => keysToUpdate.map((k: K[number]) => [k, source[k]]) as Entries<O, K>,
    )((source) => (parts: Entries<O, K>) => {
        const obj = { ...source } as Record<PropertyKey, unknown>;
        for (const [k, v] of parts) {
            if (Object.hasOwn(obj, k)) {
                obj[k] = v;
            }
        }
        return obj as O;
    });

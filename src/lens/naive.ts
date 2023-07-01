/**
 * Naive representation of Lens.
 *
 * Data flow:
 * ```text
 * S -->---> A
 *      |
 *      V
 * T <--O<-- B
 * ```
 */
export type Lens<S, T, A, B> = readonly [
    getter: (store: S) => A,
    setter: (store: S) => (newValue: B) => T,
];
export type LensSimple<S, A> = Lens<S, S, A, A>;

/**
 * Data flow:
 * ```text
 * S -->---> A -->---> U
 *      |         |
 *      V         V
 * T <--O<-- B <--O<-- V
 * ```
 */
export const compose =
    <S, T, A, B>(l: Lens<S, T, A, B>) =>
    <U, V>(r: Lens<A, B, U, V>): Lens<S, T, U, V> =>
        [
            (store) => r[0](l[0](store)),
            (store) => (v) => {
                const a = l[0](store);
                const b = r[1](a)(v);
                return l[1](store)(b);
            },
        ];

export const fromGetSet =
    <S, A>(getter: (store: S) => A) =>
    <T, B>(setter: (store: S) => (newValue: B) => T): Lens<S, T, A, B> =>
        [getter, setter];

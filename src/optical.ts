export * as Lens from "./optical/lens.js";
export * as Prism from "./optical/prism.js";

export interface Optical<I, G, A, S> {
    readonly get: (index: I) => G;
    readonly set: (action: A) => S;
}

export const shift =
    <I>(modifier: (t: I) => I) =>
    <G, A, S>(o: Optical<I, G, A, S>): Optical<I, G, A, S> => ({
        ...o,
        get: (index) => o.get(modifier(index)),
    });

export const modify =
    <G>(modifier: (t: G) => G) =>
    <I, A, S>(o: Optical<I, G, A, S>): Optical<I, G, A, S> => ({
        ...o,
        get: (index) => modifier(o.get(index)),
    });

export const override =
    <A>(modifier: (t: A) => A) =>
    <I, G, S>(o: Optical<I, G, A, S>): Optical<I, G, A, S> => ({
        ...o,
        set: (action) => o.set(modifier(action)),
    });

export const map =
    <S>(modifier: (t: S) => S) =>
    <I, G, A>(o: Optical<I, G, A, S>): Optical<I, G, A, S> => ({
        ...o,
        set: (action) => modifier(o.set(action)),
    });

export * as Lens from "./optical/lens.js";
export * as Prism from "./optical/prism.js";

export interface Optical<I, G, A, S> {
    readonly get: (index: I) => G;
    readonly set: (action: A) => S;
}

export const shift =
    <H, I>(modifier: (i: H) => I) =>
    <G, A, S>(o: Optical<I, G, A, S>): Optical<H, G, A, S> => ({
        ...o,
        get: (index) => o.get(modifier(index)),
    });

export const modify =
    <G, H>(modifier: (g: G) => H) =>
    <I, A, S>(o: Optical<I, G, A, S>): Optical<I, H, A, S> => ({
        ...o,
        get: (index) => modifier(o.get(index)),
    });

export const override =
    <Z, A>(modifier: (a: Z) => A) =>
    <I, G, S>(o: Optical<I, G, A, S>): Optical<I, G, Z, S> => ({
        ...o,
        set: (action) => o.set(modifier(action)),
    });

export const map =
    <S, T>(modifier: (s: S) => T) =>
    <I, G, A>(o: Optical<I, G, A, S>): Optical<I, G, A, T> => ({
        ...o,
        set: (action) => modifier(o.set(action)),
    });

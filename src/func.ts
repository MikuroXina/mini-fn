export const id = <T>(x: T) => x;

export const constant =
    <T>(x: T) =>
    () =>
        x;

export const compose =
    <U, V>(f: (u: U) => V) =>
    <T>(g: (t: T) => U) =>
    (t: T) =>
        f(g(t));

export const flip =
    <T, U, V>(f: (t: T) => (u: U) => V) =>
    (u: U) =>
    (t: T): V =>
        f(t)(u);

export const until =
    <T>(pred: (t: T) => boolean) =>
    (succ: (t: T) => T): ((x: T) => T) => {
        const go = (x: T): T => {
            if (pred(x)) {
                return x;
            }
            return go(succ(x));
        };
        return go;
    };

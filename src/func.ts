import type { Arrow } from "./type-class/arrow.js";
import type { Hkt2 } from "./hkt.js";

export const id = <T>(x: T) => x;

export const constant =
    <T>(x: T) =>
    <U>(_u: U) =>
        x;

export const absurd = <T>(): T => {
    throw new Error("PANIC: absurd must not be called");
};

export const pipe =
    <T, U>(firstDo: (t: T) => U) =>
    <V>(secondDo: (u: U) => V) =>
    (t: T) =>
        secondDo(firstDo(t));

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

export interface Fn<A, B> {
    (a: A): B;
}

export interface FnHkt extends Hkt2 {
    readonly type: Fn<this["arg2"], this["arg1"]>;
}

export const fnArrow: Arrow<FnHkt> = {
    compose,
    identity: () => id,
    arr: id,
    split:
        (arrow1) =>
        (arrow2) =>
        ([b1, b2]) =>
            [arrow1(b1), arrow2(b2)],
};

import type { Monad1 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";

const someSymbol = Symbol("OptionSome");
const noneSymbol = Symbol("OptionNone");

export type Some<T> = readonly [typeof someSymbol, T];
export type None = readonly [typeof noneSymbol];

declare const optionNominal: unique symbol;
export type OptionHktKey = typeof optionNominal;
export type Option<T> = None | Some<T>;

export const some = <T>(v: T): Option<T> => [someSymbol, v];
export const none = <T>(): Option<T> => [noneSymbol];

export const fromPredicate =
    <T>(predicate: (t: T) => boolean) =>
    (t: T): Option<T> => {
        if (predicate(t)) {
            return some(t);
        }
        return none();
    };

export const toString = <T>(opt: Option<T>) => (opt[0] === someSymbol ? `some(${opt[1]})` : `none`);
export const toArray = <T>(opt: Option<T>): T[] => {
    const arr = [...opt] as unknown[];
    arr.shift();
    return arr as T[];
};

export const isSome = <T>(opt: Option<T>): opt is Some<T> => opt[0] === someSymbol;
export const isNone = <T>(opt: Option<T>): opt is None => opt[0] === noneSymbol;

export const flatten = <T>(opt: Option<Option<T>>): Option<T> => {
    if (isSome(opt)) {
        return opt[1];
    }
    return opt;
};

export const and =
    <T>(optA: Option<T>) =>
    (optB: Option<T>) => {
        if (isSome(optA)) {
            return optB;
        }
        return optA;
    };
export const andThen =
    <T>(optA: Option<T>) =>
    (optB: () => Option<T>) => {
        if (isSome(optA)) {
            return optB();
        }
        return optA;
    };
export const or =
    <T>(optA: Option<T>) =>
    (optB: Option<T>) => {
        if (isSome(optA)) {
            return optA;
        }
        return optB;
    };
export const orElse =
    <T>(optA: Option<T>) =>
    (optB: () => Option<T>) => {
        if (isSome(optA)) {
            return optA;
        }
        return optB();
    };
export const xor =
    <T>(optA: Option<T>) =>
    (optB: Option<T>) => {
        if (isSome(optA) && isNone(optB)) {
            return optA;
        }
        if (isNone(optA) && isSome(optB)) {
            return optB;
        }
        return none<T>();
    };

export const filter =
    <T>(predicate: (t: T) => boolean) =>
    (opt: Option<T>) => {
        if (isSome(opt)) {
            if (predicate(opt[1])) {
                return opt;
            }
        }
        return none<T>();
    };

export const zip =
    <T>(optA: Option<T>) =>
    <U>(optB: Option<U>): Option<[T, U]> => {
        if (isSome(optA) && isSome(optB)) {
            return some([optA[1], optB[1]]);
        }
        return none();
    };
export const unzip = <T, U>(opt: Option<[T, U]>): [Option<T>, Option<U>] => {
    if (isSome(opt)) {
        return [some(opt[1][0]), some(opt[1][1])];
    }
    return [none(), none()];
};
export const zipWith =
    <T>(optA: Option<T>) =>
    <U>(optB: Option<U>) =>
    <R, F extends (t: T, u: U) => R>(fn: F): Option<R> => {
        if (isSome(optA) && isSome(optB)) {
            return some(fn(optA[1], optB[1]));
        }
        return none();
    };

export const unwrapOr =
    <T>(init: T) =>
    (opt: Option<T>) => {
        if (isSome(opt)) {
            return opt[1];
        }
        return init;
    };
export const unwrapOrElse =
    <T>(fn: () => T) =>
    (opt: Option<T>) => {
        if (isSome(opt)) {
            return opt[1];
        }
        return fn();
    };

export const map =
    <T>(opt: Option<T>) =>
    <U>(f: (t: T) => U): Option<U> => {
        if (opt[0] === someSymbol) {
            return some(f(opt[1]));
        }
        return opt;
    };
export const mapOr =
    <U>(init: U) =>
    <T>(opt: Option<T>) =>
    (f: (t: T) => U): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return init;
    };
export const mapOrElse =
    <U>(fn: () => U) =>
    <T>(opt: Option<T>) =>
    (f: (t: T) => U): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return fn();
    };

export const flatMap =
    <T>(opt: Option<T>) =>
    <U>(f: (t: T) => Option<U>): Option<U> => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return opt;
    };

declare module "./hkt" {
    interface HktDictA1<A1> {
        [optionNominal]: Option<A1>;
    }
}

export const monoid = <T>(): Monoid<Option<T>> => ({
    combine: (l, r) => or(l)(r),
    identity: none(),
});

export const monad = <T>(): Monad1<OptionHktKey> => ({
    pure: some,
    flatMap: (f) => (opt) => flatMap(opt)(f),
    apply: (fnOpt) => (tOpt) => map(zip(fnOpt)(tOpt))(([fn, t]) => fn(t)),
});

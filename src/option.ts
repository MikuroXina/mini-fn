import { Eq, PartialEq, eqSymbol } from "./type-class/eq.js";
import { Result, err, isOk, ok } from "./result.js";

import type { Applicative1 } from "./type-class/applicative.js";
import type { GetHktA1 } from "./hkt.js";
import type { Monad1 } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Traversable1 } from "./type-class/traversable.js";

const someSymbol = Symbol("OptionSome");
export type Some<T> = readonly [typeof someSymbol, T];
export const some = <T>(v: T): Some<T> => [someSymbol, v];

const noneSymbol = Symbol("OptionNone");
export type None = readonly [typeof noneSymbol];
export const none = (): None => [noneSymbol];

declare const optionNominal: unique symbol;
export type OptionHktKey = typeof optionNominal;
export type Option<T> = None | Some<T>;

export const fromPredicate =
    <T>(predicate: (t: T) => boolean) =>
    (t: T): Option<T> => {
        if (predicate(t)) {
            return some(t);
        }
        return none();
    };

export const isSome = <T>(opt: Option<T>): opt is Some<T> => opt[0] === someSymbol;
export const isNone = <T>(opt: Option<T>): opt is None => opt[0] === noneSymbol;

export const toString = <T>(opt: Option<T>) => (isSome(opt) ? `some(${opt[1]})` : "none");
export const toArray = <T>(opt: Option<T>): T[] => {
    const arr = [...opt] as unknown[];
    arr.shift();
    return arr as T[];
};

export const partialEq = <T>(equality: PartialEq<T, T>): PartialEq<Option<T>, Option<T>> => ({
    eq: (optA: Option<T>, optB: Option<T>): boolean =>
        (isSome(optA) && isSome(optB) && equality.eq(optA[1], optB[1])) ||
        (isNone(optA) && isNone(optB)),
});
export const eq = <T>(equality: Eq<T, T>): Eq<Option<T>, Option<T>> => ({
    ...partialEq(equality),
    [eqSymbol]: true,
});

export const flatten = <T>(opt: Option<Option<T>>): Option<T> => {
    if (isSome(opt)) {
        return opt[1];
    }
    return opt;
};

export const and =
    <U>(optB: Option<U>) =>
    <T>(optA: Option<T>) => {
        if (isSome(optA)) {
            return optB;
        }
        return optA;
    };
export const andThen =
    <T, U>(optB: (t: T) => Option<U>) =>
    (optA: Option<T>) => {
        if (isSome(optA)) {
            return optB(optA[1]);
        }
        return optA;
    };
export const or =
    <T>(optB: Option<T>) =>
    (optA: Option<T>) => {
        if (isSome(optA)) {
            return optA;
        }
        return optB;
    };
export const orElse =
    <T>(optB: () => Option<T>) =>
    (optA: Option<T>) => {
        if (isSome(optA)) {
            return optA;
        }
        return optB();
    };
export const xor =
    <T>(optB: Option<T>) =>
    (optA: Option<T>) => {
        if (isSome(optA) && isNone(optB)) {
            return optA;
        }
        if (isNone(optA) && isSome(optB)) {
            return optB;
        }
        return none();
    };

export const filter =
    <T>(predicate: (t: T) => boolean) =>
    (opt: Option<T>) => {
        if (isSome(opt)) {
            if (predicate(opt[1])) {
                return opt;
            }
        }
        return none();
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
    <T, U, R>(fn: (t: T, u: U) => R) =>
    (optA: Option<T>) =>
    (optB: Option<U>): Option<R> => {
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
    <T, U>(f: (t: T) => U) =>
    (opt: Option<T>): Option<U> => {
        if (opt[0] === someSymbol) {
            return some(f(opt[1]));
        }
        return opt;
    };
export const mapOr =
    <U>(init: U) =>
    <T>(f: (t: T) => U) =>
    (opt: Option<T>): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return init;
    };
export const mapOrElse =
    <U>(fn: () => U) =>
    <T>(f: (t: T) => U) =>
    (opt: Option<T>): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return fn();
    };

export const contains =
    <T>(x: T) =>
    (opt: Option<T>) =>
        mapOr(false)((t) => t === x)(opt);

export const optResToResOpt = <E, T>(optRes: Option<Result<E, T>>): Result<E, Option<T>> => {
    if (isNone(optRes)) {
        return ok(none());
    }
    if (isOk(optRes[1])) {
        return ok(some(optRes[1][1]));
    }
    return err(optRes[1][1]);
};

export const okOr =
    <E>(e: E) =>
    <T>(opt: Option<T>): Result<E, T> =>
        mapOrElse(() => err<E, T>(e))((t: T) => ok(t))(opt);
export const okOrElse =
    <E>(e: () => E) =>
    <T>(opt: Option<T>): Result<E, T> =>
        mapOrElse(() => err<E, T>(e()))((t: T) => ok(t))(opt);

export const flatMap = andThen;

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [optionNominal]: Option<A1>;
    }
}

export const monoid = <T>(): Monoid<Option<T>> => ({
    combine: (l, r) => or(l)(r),
    identity: none(),
});

export const monad: Monad1<OptionHktKey> = {
    product: zip,
    pure: some,
    map,
    flatMap,
    apply:
        <T1, U1>(fnOpt: Option<(t: T1) => U1>) =>
        (tOpt: Option<T1>) =>
            flatMap((fn: (t: T1) => U1) => map(fn)(tOpt))(fnOpt),
};

export const traversable: Traversable1<OptionHktKey> = {
    map,
    foldR: (folder) => (init) => (data) => {
        if (isNone(data)) {
            return init;
        }
        return folder(data[1])(init);
    },
    traverse:
        <F>(app: Applicative1<F>) =>
        <A, B>(visitor: (a: A) => GetHktA1<F, B>) =>
        (opt: Option<A>): GetHktA1<F, Option<B>> => {
            if (isNone(opt)) {
                return app.pure(none() as Option<B>);
            }
            return app.map<B, Option<B>>(some)(visitor(opt[1]));
        },
};

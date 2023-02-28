import type { Get1, Hkt1 } from "./hkt.js";
import { Ordering, equal, greater, less } from "./ordering.js";
import { Result, err, isOk, ok } from "./result.js";
import type { Applicative } from "./type-class/applicative.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";
import type { Traversable } from "./type-class/traversable.js";

const someSymbol = Symbol("OptionSome");
export type Some<T> = readonly [typeof someSymbol, T];
export const some = <T>(v: T): Some<T> => [someSymbol, v];

const noneSymbol = Symbol("OptionNone");
export type None = readonly [typeof noneSymbol];
export const none = (): None => [noneSymbol];

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

export const partialEquality =
    <T>(equalityT: PartialEq<T>) =>
    (optA: Option<T>, optB: Option<T>): boolean =>
        (isSome(optA) && isSome(optB) && equalityT.eq(optA[1], optB[1])) ||
        (isNone(optA) && isNone(optB));
export const partialEq = fromPartialEquality(partialEquality);
export const equality =
    <T>(equalityT: Eq<T>) =>
    (optA: Option<T>, optB: Option<T>): boolean =>
        (isSome(optA) && isSome(optB) && equalityT.eq(optA[1], optB[1])) ||
        (isNone(optA) && isNone(optB));
export const eq = fromEquality(equality);
export const partialCmp =
    <T>(order: PartialOrd<T>) =>
    (l: Option<T>, r: Option<T>): Option<Ordering> => {
        // considered that None is lesser than Some
        if (isNone(l)) {
            if (isNone(r)) {
                return some(equal);
            }
            return some(less);
        }
        if (isNone(r)) {
            return some(greater);
        }
        return order.partialCmp(l[1], r[1]);
    };
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <T>(order: Ord<T>) =>
    (l: Option<T>, r: Option<T>): Ordering => {
        // considered that None is lesser than Some
        if (isNone(l)) {
            if (isNone(r)) {
                return equal;
            }
            return less;
        }
        if (isNone(r)) {
            return greater;
        }
        return order.cmp(l[1], r[1]);
    };
// This argument wrapper is needed for avoid cyclic-import problem.
export const ord = <T>(order: Ord<T, T>) => fromCmp(cmp)(order);

export const flatten = <T>(opt: Option<Option<T>>): Option<T> => {
    if (isSome(opt)) {
        return opt[1];
    }
    return opt;
};

export const unwrap = <T>(opt: Option<T>): T => {
    if (isNone(opt)) {
        throw new Error("unwrapped None");
    }
    return opt[1];
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

export interface OptionHkt extends Hkt1 {
    readonly type: Option<this["arg1"]>;
}

export const monoid = <T>(): Monoid<Option<T>> => ({
    combine: (l, r) => or(l)(r),
    identity: none(),
});

export const monad: Monad<OptionHkt> = {
    pure: some,
    map,
    flatMap,
    apply:
        <T1, U1>(fnOpt: Option<(t: T1) => U1>) =>
        (tOpt: Option<T1>) =>
            flatMap((fn: (t: T1) => U1) => map(fn)(tOpt))(fnOpt),
};

export const traversable: Traversable<OptionHkt> = {
    map,
    foldR: (folder) => (init) => (data) => {
        if (isNone(data)) {
            return init;
        }
        return folder(data[1])(init);
    },
    traverse:
        <F extends Hkt1>(app: Applicative<F>) =>
        <A, B>(visitor: (a: A) => Get1<F, B>) =>
        (opt: Option<A>): Get1<F, Option<B>> => {
            if (isNone(opt)) {
                return app.pure(none() as Option<B>);
            }
            return app.map<B, Option<B>>(some)(visitor(opt[1]));
        },
};

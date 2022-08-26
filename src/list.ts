import type { Monad1 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";
import { Cat, Option } from "./lib";
import type { PartialEq } from "./type-class/eq";
import type { Traversable1 } from "./type-class/traversable";
import type { GetHktA1, HktKeyA1 } from "hkt";
import { Applicative } from "./type-class";

export interface List<out T> {
    current(): Option.Option<T>;
    rest(): List<T>;
}

export const isNull = <T>(list: List<T>): boolean => Option.isNone(list.current());

export function* toIterator<T>(list: List<T>): Generator<T, void> {
    let rest = list;
    while (true) {
        const next = rest.current();
        if (Option.isNone(next)) {
            break;
        }
        yield next[1];
        rest = list.rest();
    }
}

export const unCons = <T>(list: List<T>): Option.Option<[T, List<T>]> =>
    Option.map((curr: T): [T, List<T>] => [curr, list.rest()])(list.current());
export const either =
    <U>(def: () => U) =>
    <T>(mapper: (x: T, xs: List<T>) => U) =>
    (list: List<T>): U =>
        Option.mapOrElse(def)(([x, xs]: [T, List<T>]) => mapper(x, xs))(unCons(list));

export const map =
    <T, U>(f: (t: T) => U) =>
    (list: List<T>): List<U> => ({
        current: () => Option.map(f)(list.current()),
        rest: () => map(f)(list.rest()),
    });

export const plus =
    <T>(left: List<T>) =>
    (right: List<T>): List<T> => ({
        current: () => Option.and(right.current())(left.current()),
        rest: () => plus(left.rest())(right.rest()),
    });
export const appendToHead =
    <T>(value: T) =>
    (list: List<T>): List<T> => ({
        current: () => Option.some(value),
        rest: () => list,
    });
export const appendToTail =
    <T>(value: T) =>
    (list: List<T>): List<T> => ({
        current: () => Option.andThen(() => Option.some(value))(list.current()),
        rest: () => appendToTail(value)(list.rest()),
    });

export const empty = <T>(): List<T> => ({ current: Option.none, rest: empty });
export const singletonWith = <T>(value: () => T): List<T> => ({
    current: () => Option.some(value()),
    rest: empty,
});
export const singleton = <T>(value: T): List<T> => singletonWith(() => value);

export const repeatWith = <T>(elem: () => T): List<T> => ({
    current: () => Option.some(elem()),
    rest: () => repeatWith(elem),
});
export const repeat = <T>(value: T) => repeatWith(() => value);

export const successors =
    <T>(succ: (t: T) => T) =>
    (init: T): List<T> => ({
        current: () => Option.some(init),
        rest: () => successors(succ)(succ(init)),
    });

export const range = (start: number, end: number, step = 1): List<number> => ({
    current: () => Option.fromPredicate((x: number) => x < end)(start),
    rest: () => range(start + step, end, step),
});

export const digits = (num: number, radix: number): List<number> => ({
    current: () => (num === 0 ? Option.none() : Option.some(num % radix)),
    rest: () => digits(num / radix, radix),
});

export const fromString = (str: string): List<string> => ({
    current: () => Option.fromPredicate((x: string) => x === "")(str.slice(0, 1)),
    rest: () => fromString(str.slice(1)),
});
export const fromArray = <T>(arr: T[]): List<T> => ({
    current: () => (0 in arr ? Option.some(arr[0]) : Option.none()),
    rest: () => fromArray(arr.slice(1)),
});
export const fromOption = <T>(opt: Option.Option<T>): List<T> => ({
    current: () => opt,
    rest: empty,
});

export const foldL =
    <T, U>(f: (a: U) => (b: T) => U) =>
    (init: U) =>
    (list: List<T>): U => {
        let res = init;
        for (const t of toIterator(list)) {
            res = f(res)(t);
        }
        return res;
    };
export const foldL1 =
    <T>(f: (a: T) => (b: T) => T) =>
    (list: List<T>): T =>
        either<T>(() => {
            throw new Error("expected a list having one element at least");
        })((x: T, xs) => foldL(f)(x)(xs))(list);
export const foldR =
    <T, U>(f: (a: T) => (b: U) => U) =>
    (init: U) =>
    (list: List<T>): U => {
        let res = init;
        for (const t of toIterator(list)) {
            res = f(t)(res);
        }
        return res;
    };
export const foldR1 =
    <T>(f: (a: T) => (b: T) => T) =>
    (list: List<T>): T =>
        either<T>(() => {
            throw new Error("expected a list having one element at least");
        })((x: T, xs) => foldR(f)(x)(xs))(list);
export const length = <T>(list: List<T>): number => foldL((a: number) => () => a + 1)(0)(list);

export const build = <A>(g: <B>(gg: (a: A) => (b: B) => B) => (b: B) => B): List<A> =>
    g(appendToHead)(empty());

export const concat = <T>(listList: List<List<T>>): List<T> =>
    build(
        <U>(c: (a: T) => (b: U) => U) =>
            (n: U) =>
                foldR((x: List<T>) => (y: U) => foldR(c)(y)(x))(n)(listList),
    );
export const concatMap =
    <T, U>(fn: (t: T) => List<U>) =>
    (list: List<T>): List<U> =>
        build(
            <B>(c: (u: U) => (b: B) => B) =>
                (n: B) =>
                    foldR((x: T) => (b: B) => foldR(c)(b)(fn(x)))(n)(list),
        );

export const scanL =
    <T, U>(f: (u: U) => (t: T) => U) =>
    (init: U) =>
    (src: List<T>): List<U> => {
        const res = [init];
        for (const t of toIterator(src)) {
            const next = f(res[res.length - 1])(t);
            res.push(next);
        }
        return fromArray(res);
    };

export const head = <T>(list: List<T>): Option.Option<T> => list.current();
export const last = <T>(list: List<T>): Option.Option<T> => {
    const first = list.current();
    if (Option.isNone(first)) {
        return first;
    }
    let rest = list;
    while (true) {
        const next = list.rest();
        if (Option.isNone(next.current())) {
            return rest.current();
        }
        rest = next;
    }
};

export const tail = <T>(list: List<T>): List<T> => list.rest();
export const reverse = <T>(list: List<T>): List<T> => {
    const curr = list.current();
    if (Option.isNone(curr)) {
        return list;
    }
    return appendToTail(curr[1])(reverse(list.rest()));
};
export const init = <T>(list: List<T>): List<T> => reverse(tail(reverse(list)));

export const zip =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>): List<[T, U]> => ({
        current: () => Option.zip(aList.current())(bList.current()),
        rest: () => zip(aList.rest())(bList.rest()),
    });
export const zip3 =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>) =>
    <V>(cList: List<V>): List<[T, U, V]> => ({
        current: () => {
            const [a, b, c] = [aList.current(), bList.current(), cList.current()];
            if (Option.isSome(a) && Option.isSome(b) && Option.isSome(c)) {
                return Option.some([a[1], b[1], c[1]]);
            }
            return Option.none();
        },
        rest: () => zip3(aList.rest())(bList.rest())(cList.rest()),
    });
export const zip4 =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>) =>
    <V>(cList: List<V>) =>
    <W>(dList: List<W>): List<[T, U, V, W]> => ({
        current: () => {
            const [a, b, c, d] = [
                aList.current(),
                bList.current(),
                cList.current(),
                dList.current(),
            ];
            if (Option.isSome(a) && Option.isSome(b) && Option.isSome(c) && Option.isSome(d)) {
                return Option.some([a[1], b[1], c[1], d[1]]);
            }
            return Option.none();
        },
        rest: () => zip4(aList.rest())(bList.rest())(cList.rest())(dList.rest()),
    });

export const zipWith = <T, U, V>(
    f: (t: T) => (u: U) => V,
): ((lList: List<T>) => (rList: List<U>) => List<V>) => {
    const go =
        (lList: List<T>) =>
        (rList: List<U>): List<V> => {
            const [l, r] = [lList.current(), rList.current()];
            if (Option.isNone(l) || Option.isNone(r)) {
                return empty();
            }
            return appendToHead(f(l[1])(r[1]))(go(lList.rest())(rList.rest()));
        };
    return go;
};

export const unzip = <A, B>(list: List<[A, B]>): [List<A>, List<B>] =>
    foldR<[A, B], [List<A>, List<B>]>(([a, b]) => ([as, bs]) => [
        appendToHead(a)(as),
        appendToHead(b)(bs),
    ])([empty(), empty()])(list);

const prependToAll =
    <T>(sep: T) =>
    (list: List<T>): List<T> =>
        either(() => list)(
            (x: T, xs) =>
                Cat.cat(xs).feed(prependToAll(sep)).feed(appendToHead(x)).feed(appendToHead(sep))
                    .value,
        )(list);
export const intersperse =
    <T>(sep: T) =>
    (list: List<T>): List<T> =>
        either(() => list)((x: T, xs) => appendToHead(x)(prependToAll(sep)(xs)))(list);
export const intercalate =
    <T>(separator: List<T>) =>
    (listList: List<List<T>>): List<T> =>
        concat(intersperse(separator)(listList));

export const subsequencesExceptEmpty = <T>(list: List<T>): List<List<T>> =>
    either<List<List<T>>>(empty)((x: T, xs) => {
        const f =
            (ys: List<T>) =>
            (r: List<List<T>>): List<List<T>> =>
                appendToHead(ys)(appendToHead(appendToHead(x)(ys))(r));
        return appendToHead(singleton(x))(foldR(f)(empty())(subsequencesExceptEmpty(xs)));
    })(list);
export const subsequences = <T>(list: List<T>): List<List<T>> =>
    plus<List<T>>(empty())(subsequencesExceptEmpty(list));

export const permutations = <A>(list: List<A>): List<List<A>> => {
    const perms =
        <T>(tList: List<T>) =>
        (uList: List<T>): List<List<T>> =>
            either<List<List<T>>>(empty)((t: T, ts): List<List<T>> => {
                const interleaveF =
                    (f: (a: List<T>) => List<T>) =>
                    (yList: List<T>) =>
                    (r: List<List<T>>): [List<T>, List<List<T>>] =>
                        either<[List<T>, List<List<T>>]>(() => [ts, r])((y: T, ys) => {
                            const [us, zs] = interleaveF((x) => f(appendToHead(y)(x)))(ys)(r);
                            return [
                                appendToHead(y)(us),
                                appendToHead(f(appendToHead(t)(appendToHead(t)(us))))(zs),
                            ];
                        })(yList);
                const interleave =
                    (xList: List<T>) =>
                    (r: List<List<T>>): List<List<T>> =>
                        interleaveF((x) => x)(xList)(r)[1];
                return foldR(interleave)(perms(ts)(appendToHead(t)(uList)))(permutations(uList));
            })(tList);
    return appendToHead(list)(perms(list)(empty()));
};

export const unfoldR =
    <T, U>(fn: (u: U) => Option.Option<[T, U]>) =>
    (initial: U): List<T> =>
        build(<B>(c: (t: T) => (b: B) => B) => (n: B): B => {
            const go = (b: U): B => {
                const opt = fn(b);
                if (Option.isNone(opt)) {
                    return n;
                }
                const [a, next] = opt[1];
                return c(a)(go(next));
            };
            return go(initial);
        });

export const take =
    (count: number) =>
    <T>(list: List<T>): List<T> => {
        if (count <= 1) {
            return fromArray(Option.toArray(head(list)));
        }
        const curr = list.current();
        if (Option.isNone(curr)) {
            return list;
        }
        return appendToHead(curr[1])(take(count - 1)(list.rest()));
    };
export const drop =
    (count: number) =>
    <T>(list: List<T>): List<T> =>
        count <= 0 ? list : take(count - 1)(tail(list));
export const splitAt =
    (index: number) =>
    <T>(list: List<T>): [List<T>, List<T>] =>
        [take(index)(list), drop(index)(list)];

export const replicate =
    (count: number) =>
    <T>(value: T): List<T> =>
        take(count)(repeat(value));

export const atMay =
    (index: number) =>
    <T>(list: List<T>): Option.Option<T> =>
        drop(index)(list).current();
export const findIndex =
    <T>(pred: (value: T) => boolean) =>
    (list: List<T>): Option.Option<number> => {
        let index = 0;
        for (const elem of toIterator(list)) {
            if (pred(elem)) {
                return Option.some(index);
            }
            index += 1;
        }
        return Option.none();
    };
export const elemIndex =
    <T>(eq: PartialEq<T, T>) =>
    (target: T) =>
        findIndex((value: T) => eq.eq(value, target));
export const findIndices =
    <T>(pred: (value: T) => boolean) =>
    (list: List<T>): number[] => {
        const indices = [];
        let index = 0;
        for (const elem of toIterator(list)) {
            if (pred(elem)) {
                indices.push(index);
            }
            index += 1;
        }
        return indices;
    };
export const elemIndices =
    <T>(eq: PartialEq<T, T>) =>
    (target: T) =>
        findIndices((value: T) => eq.eq(value, target));

export const takeWhile =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): List<T> => ({
        current: list.current,
        rest: () =>
            Option.unwrapOr(true)(Option.map(pred)(list.current())) ? empty() : list.rest(),
    });

export const dropWhile =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): List<T> =>
        either<List<T>>(empty)((x: T, xs) => (pred(x) ? dropWhile(pred)(xs) : xs))(list);
export const dropWhileEnd = <T>(pred: (t: T) => boolean): ((list: List<T>) => List<T>) =>
    foldR<T, List<T>>((x) => (xs) => pred(x) && isNull(xs) ? empty() : appendToHead(x)(xs))(
        empty(),
    );

export const span =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): [List<T>, List<T>] =>
        either<[List<T>, List<T>]>(() => [empty(), empty()])((x: T, xs) => {
            if (pred(x)) {
                const [ys, zs] = span(pred)(xs);
                return [appendToHead(x)(ys), zs];
            }
            return [empty(), xs];
        })(list);
export const spanNot = <T>(pred: (t: T) => boolean) => span((t: T) => !pred(t));

export const stripPrefix =
    <T>(eq: PartialEq<T, T>) =>
    (prefix: List<T>) =>
    (list: List<T>): Option.Option<List<T>> =>
        either(() => (isNull(list) ? Option.none() : Option.some(list)))((x: T, xs) =>
            Option.andThen(([y, ys]: [T, List<T>]) =>
                eq.eq(x, y) ? stripPrefix<T>(eq)(xs)(ys) : Option.none(),
            )(unCons(list)),
        )(prefix);

export const groupBy = <T>(f: (l: T) => (r: T) => boolean): ((list: List<T>) => List<List<T>>) =>
    either<List<List<T>>>(empty)((x: T, xs): List<List<T>> => {
        const [ys, zs] = span(f(x))(xs);
        return appendToHead(appendToHead(x)(ys))(groupBy(f)(zs));
    });
export const group = <T>(eq: PartialEq<T, T>): ((list: List<T>) => List<List<T>>) =>
    groupBy((l) => (r) => eq.eq(l, r));

declare const listNominal: unique symbol;
export type ListHktKey = typeof listNominal;

declare module "./hkt" {
    interface HktDictA1<A1> {
        [listNominal]: List<A1>;
    }
}

export const monoid = <T>(): Monoid<List<T>> => ({
    identity: empty(),
    combine: (l, r) => plus(l)(r),
});

export const monad: Monad1<ListHktKey> = {
    product: zip,
    pure: singleton,
    map,
    flatMap: (fn) => (t) => concat(map(fn)(t)),
    apply:
        <T1, U1>(fns: List<(t: T1) => U1>) =>
        (t: List<T1>): List<U1> =>
            concat(map((fn: (t: T1) => U1) => map(fn)(t))(fns)),
};

export const traversable: Traversable1<ListHktKey> = {
    map,
    foldR,
    traverse:
        <F extends HktKeyA1>(app: Applicative.Applicative1<F>) =>
        <A, B>(visitor: (a: A) => GetHktA1<F, B>): ((list: List<A>) => GetHktA1<F, List<B>>) => {
            const consF =
                (x: A) =>
                (ys: GetHktA1<F, List<B>>): GetHktA1<F, List<B>> =>
                    Applicative.liftA2(app)(appendToHead)(visitor(x))(ys);
            return foldR(consF)(app.pure(empty()));
        },
};

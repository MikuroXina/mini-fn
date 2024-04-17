import { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import {
    cmp as listCmp,
    fromIterable,
    isNull,
    List,
    partialCmp as listPartialCmp,
} from "./list.ts";
import { isNone, isSome, none, Option, some } from "./option.ts";
import { Ordering } from "./ordering.ts";
import { isOk, Result } from "./result.ts";
import {
    ord as tupleOrd,
    partialOrd as tuplePartialOrd,
    Tuple,
} from "./tuple.ts";
import { Applicative } from "./type-class/applicative.ts";
import { fromEquality } from "./type-class/eq.ts";
import { Foldable } from "./type-class/foldable.ts";
import { Functor } from "./type-class/functor.ts";
import { Monoid } from "./type-class/monoid.ts";
import { fromCmp, Ord } from "./type-class/ord.ts";
import { fromPartialEquality, PartialEq } from "./type-class/partial-eq.ts";
import { fromPartialCmp } from "./type-class/partial-ord.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import { Traversable } from "./type-class/traversable.ts";
import { cmp as stringCmp, ord as stringOrd } from "./string.ts";
import {
    type Code,
    type Decoder,
    decU32Be,
    decUtf8,
    type Encoder,
    encU32Be,
    encUtf8,
    failDecoder,
    flatMapDecoder,
    monadForCodeM,
    monadForDecoder,
    pureCodeM,
    pureDecoder,
    pureForDecoder,
} from "./serial.ts";
import { foldR as foldRArray } from "./array.ts";
import { doT } from "./cat.ts";
import { when } from "./type-class/pure.ts";

export const eq =
    <K extends string, V>(equality: PartialEq<V>) =>
    (l: Record<K, V>, r: Record<K, V>): boolean => {
        for (const leftKey of (Object.keys(l) as (keyof typeof l)[])) {
            const leftValue = l[leftKey];
            const rightValue = r[leftKey];
            if (
                !leftValue || !rightValue ||
                !equality.eq(leftValue, rightValue)
            ) {
                return false;
            }
        }
        return true;
    };
export const partialCmp = <K extends string, V>(
    ordV: Ord<V>,
) =>
(l: Record<K, V>, r: Record<K, V>): Option<Ordering> => {
    const sorter = sortedEntries<K, V>(ordV);
    const sortedL = sorter(l);
    const sortedR = sorter(r);
    return listPartialCmp<Tuple<K, V>>(
        tuplePartialOrd({ ordA: stringOrd, ordB: ordV }),
    )(sortedL, sortedR);
};
export const cmp = <K extends string, V>(
    ordV: Ord<V>,
) =>
(l: Record<K, V>, r: Record<K, V>): Ordering => {
    const sorter = sortedEntries<K, V>(ordV);
    const sortedL = sorter(l);
    const sortedR = sorter(r);
    return listCmp<Tuple<K, V>>(
        tupleOrd({ ordA: stringOrd, ordB: ordV }),
    )(sortedL, sortedR);
};

export const partialEquality = fromPartialEquality(eq);
export const equality = fromEquality(eq);
export const partialOrd = fromPartialCmp(partialCmp);
export const ord = fromCmp(cmp);

export const isEmpty = <K extends string, V>(m: Record<K, V>): boolean =>
    Object.keys(m).length === 0;
export const size = <K extends string, V>(m: Record<K, V>): number =>
    Object.keys(m).length;

export const has =
    <K extends string>(key: K) => <V>(m: Record<K, V>): boolean => key in m;
export const get =
    <K extends string>(key: K) => <V>(m: Record<K, V>): Option<V> =>
        key in m ? some(m[key]) : none();

export const empty = <K extends string, V>(): Record<K, V> =>
    ({}) as Record<K, V>;

export const singleton =
    <const K extends string>(key: K) => <V>(value: V): Record<K, V> =>
        ({
            [key]: value,
        }) as Record<K, V>;

export const fromList = <K extends string, V>(
    list: List<Tuple<K, V>>,
): Record<K, V> => {
    const m = {} as Record<K, V>;
    while (!isNull(list)) {
        const [key, value] = list.current()[1]!;
        m[key] = value;
        list = list.rest();
    }
    return m;
};
export const fromListWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K extends string>(list: List<Tuple<K, V>>): Record<K, V> => {
        const m = {} as Record<K, V>;
        while (!isNull(list)) {
            const [key, value] = list.current()[1]!;
            m[key] = (key in m) ? combiner(value)(m[key]) : value;
            list = list.rest();
        }
        return m;
    };
export const fromListWithKey = <K extends string, V>(
    combiner: (key: K) => (newValue: V) => (oldValue: V) => V,
) =>
(list: List<Tuple<K, V>>): Record<K, V> => {
    const m = {} as Record<K, V>;
    while (!isNull(list)) {
        const [key, value] = list.current()[1]!;
        m[key] = (key in m) ? combiner(key)(value)(m[key]) : value;
        list = list.rest();
    }
    return m;
};

export const fromArray = <K extends string, V>(
    arr: readonly Tuple<K, V>[],
): Record<K, V> => Object.fromEntries(arr) as Record<K, V>;
export const fromArrayWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K extends string>(arr: readonly Tuple<K, V>[]): Record<K, V> => {
        const m = {} as Record<K, V>;
        for (const [key, value] of arr) {
            if (key in m) {
                m[key] = combiner(value)(m[key]);
            } else {
                m[key] = value;
            }
        }
        return m;
    };

export const clone = <K extends string, V>(m: Record<K, V>): Record<K, V> => ({
    ...m,
});

export const insert =
    <K extends string>(key: K) =>
    <V>(value: V) =>
    (m: Record<K, V>): Record<K, V> => ({ ...m, [key]: value });
export const insertWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K extends string>(key: K) =>
    (value: V) =>
    (m: Record<K, V>): Record<K, V> => {
        const cloned = clone(m);
        if (key in cloned) {
            cloned[key] = combiner(value)(cloned[key]);
            return cloned;
        }
        cloned[key] = value;
        return cloned;
    };
export const insertWithKey = <K extends string, V>(
    combiner: (key: K) => (newValue: V) => (oldValue: V) => V,
) =>
(key: K) =>
(value: V) =>
(m: Record<K, V>): Record<K, V> => {
    const cloned = clone(m);
    if (key in cloned) {
        cloned[key] = combiner(key)(value)(cloned[key]);
        return cloned;
    }
    cloned[key] = value;
    return cloned;
};

export const remove =
    <K extends string>(key: K) => <V>(m: Record<K, V>): Record<K, V> => {
        if (!(key in m)) {
            return m;
        }
        const cloned = clone(m);
        delete cloned[key];
        return cloned;
    };

export const adjust =
    <V>(mapper: (oldValue: V) => V) =>
    <K extends string>(key: K) =>
    (m: Record<K, V>): Record<K, V> => {
        if (!(key in m)) {
            return m;
        }
        const cloned = clone(m);
        cloned[key] = mapper(m[key]);
        return cloned;
    };
export const adjustWithKey =
    <K extends string, V>(mapper: (key: K) => (oldValue: V) => V) =>
    (key: K) =>
    (m: Record<K, V>): Record<K, V> => {
        if (!(key in m)) {
            return m;
        }
        const cloned = clone(m);
        cloned[key] = mapper(key)(m[key]);
        return cloned;
    };

export const update =
    <V>(updater: (oldValue: V) => Option<V>) =>
    <K extends string>(key: K) =>
    (m: Record<K, V>): Record<K, V> => {
        if (!(key in m)) {
            return m;
        }
        const toUpdate = updater(m[key]);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };
export const updateWithKey =
    <K extends string, V>(updater: (key: K) => (oldValue: V) => Option<V>) =>
    (key: K) =>
    (m: Record<K, V>): Record<K, V> => {
        if (!(key in m)) {
            return m;
        }
        const toUpdate = updater(key)(m[key]);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };

export const alter =
    <V>(updater: (oldEntry: Option<V>) => Option<V>) =>
    <K extends string>(key: K) =>
    (m: Record<K, V>): Record<K, V> => {
        const toUpdate = updater(get(key)(m));
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };

export const alterF =
    <F>(f: Functor<F>) =>
    <V>(updater: (oldEntry: Option<V>) => Get1<F, Option<V>>) =>
    <K extends string>(key: K) =>
    (m: Record<K, V>): Get1<F, Record<K, V>> =>
        f.map((toUpdate: Option<V>) =>
            isNone(toUpdate) ? remove(key)(m) : insert(key)(toUpdate[1])(m)
        )(updater(get(key)(m)));

export const union =
    <K extends string, V>(left: Record<K, V>) =>
    (right: Record<K, V>): Record<K, V> => ({ ...right, ...left });

export const unionWith =
    <V>(combiner: (left: V) => (right: V) => V) =>
    <K extends string>(left: Record<K, V>) =>
    (right: Record<K, V>): Record<K, V> => {
        const cloned = clone(left);
        for (
            const [rightKey, rightValue] of Object.entries(right) as [K, V][]
        ) {
            cloned[rightKey] = (rightKey in cloned)
                ? combiner(cloned[rightKey])(rightValue)
                : rightValue;
        }
        return cloned;
    };
export const unionWithKey =
    <K extends string, V>(combiner: (key: K) => (left: V) => (right: V) => V) =>
    (left: Record<K, V>) =>
    (right: Record<K, V>): Record<K, V> => {
        const cloned = clone(left);
        for (
            const [rightKey, rightValue] of Object.entries(right) as [K, V][]
        ) {
            cloned[rightKey] = (rightKey in cloned)
                ? combiner(rightKey)(cloned[rightKey])(
                    rightValue,
                )
                : rightValue;
        }
        return cloned;
    };
export const unionMonoid = <K extends string, V>(): Monoid<Record<K, V>> => ({
    identity: empty(),
    combine: (l, r) => union(l)(r),
    [semiGroupSymbol]: true,
});

export const difference = <K extends string, V1>(left: Record<K, V1>) =>
<V2>(
    right: Record<K, V2>,
): Record<K, V1> => {
    const cloned = clone(left);
    for (const rightKey of Object.keys(right) as K[]) {
        delete cloned[rightKey];
    }
    return cloned;
};
export const differenceWith = <V1, V2 = V1>(
    combiner: (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
<K extends string>(left: Record<K, V1>) =>
(right: Record<K, V2>): Record<K, V1> => {
    const cloned = clone(left);
    for (
        const [rightKey, rightValue] of Object.entries(right) as [K, V2][]
    ) {
        if (!(rightKey in cloned)) {
            continue;
        }
        const toUpdate = combiner(left[rightKey])(rightValue);
        if (isNone(toUpdate)) {
            delete cloned[rightKey];
        } else {
            cloned[rightKey] = toUpdate[1];
        }
    }
    return cloned;
};
export const differenceWithKey = <K extends string, V1, V2 = V1>(
    combiner: (key: K) => (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
(left: Record<K, V1>) =>
(right: Record<K, V2>): Record<K, V1> => {
    const cloned = clone(left);
    for (const [rightKey, rightValue] of Object.entries(right) as [K, V2][]) {
        if (!(rightKey in cloned)) {
            continue;
        }
        const toUpdate = combiner(rightKey)(left[rightKey])(
            rightValue,
        );
        if (isNone(toUpdate)) {
            delete cloned[rightKey];
        } else {
            cloned[rightKey] = toUpdate[1];
        }
    }
    return cloned;
};

export const intersection = <K extends string, V1>(left: Record<K, V1>) =>
<V2>(
    right: Record<K, V2>,
): Record<K, V1> => {
    const m = {} as Record<K, V1>;
    for (const [leftKey, leftValue] of Object.entries(left) as [K, V1][]) {
        if (leftKey in right) {
            m[leftKey] = leftValue;
        }
    }
    return m;
};
export const intersectionWith =
    <V1, V2 = V1, V3 = V1>(combiner: (left: V1) => (right: V2) => V3) =>
    <K extends string>(left: Record<K, V1>) =>
    (right: Record<K, V2>): Record<K, V3> => {
        const m = {} as Record<K, V3>;
        for (const [leftKey, leftValue] of Object.entries(left) as [K, V1][]) {
            if (leftKey in right) {
                m[leftKey] = combiner(leftValue)(right[leftKey]);
            }
        }
        return m;
    };
export const intersectionWithKey = <K extends string, V1, V2 = V1, V3 = V1>(
    combiner: (key: K) => (left: V1) => (right: V2) => V3,
) =>
(left: Record<K, V1>) =>
(right: Record<K, V2>): Record<K, V3> => {
    const m = {} as Record<K, V3>;
    for (const [leftKey, leftValue] of Object.entries(left) as [K, V1][]) {
        if (leftKey in right) {
            m[leftKey] = combiner(leftKey)(leftValue)(right[leftKey]);
        }
    }
    return m;
};

export const isDisjoint =
    <K extends string, V1>(left: Record<K, V1>) =>
    <V2>(right: Record<K, V2>): boolean => {
        for (const leftKey of Object.keys(left)) {
            if (leftKey in right) {
                return false;
            }
        }
        return true;
    };

export const compose =
    <U extends PropertyKey, V>(uv: Record<U, V>) =>
    <T extends string>(tu: Record<T, U>): Record<T, V> => {
        const m = {} as Record<T, V>;
        for (const [t, u] of Object.entries(tu) as [T, U][]) {
            if (Object.hasOwn(uv, u)) {
                m[t] = uv[u];
            }
        }
        return m;
    };

export const map =
    <A, B>(mapper: (a: A) => B) =>
    <K extends string>(ma: Record<K, A>): Record<K, B> => {
        const mb = {} as Record<K, B>;
        for (const [key, value] of Object.entries(ma) as [K, A][]) {
            mb[key] = mapper(value);
        }
        return mb;
    };
export const mapWithKey =
    <K extends string, A, B>(mapper: (key: K) => (a: A) => B) =>
    (
        ma: Record<K, A>,
    ): Record<K, B> => {
        const mb = {} as Record<K, B>;
        for (const [key, value] of Object.entries(ma) as [K, A][]) {
            mb[key] = mapper(key)(value);
        }
        return mb;
    };

export const traverse =
    <T>(app: Applicative<T>) =>
    <V, X>(visitor: (value: V) => Get1<T, X>) =>
    <K extends string>(m: Record<K, V>): Get1<T, Record<K, X>> => {
        let acc = app.pure({} as Record<K, X>);
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            acc = app.apply(app.map(insert(key))(visitor(value)))(acc);
        }
        return acc;
    };

export const traverseWithKey =
    <T>(app: Applicative<T>) =>
    <K extends string, A, B>(mapper: (key: K) => (a: A) => Get1<T, B>) =>
    (ka: Record<K, A>): Get1<T, Record<K, B>> => {
        let traversing = app.pure({} as Record<K, B>);
        for (const [key, value] of Object.entries(ka) as [K, A][]) {
            traversing = app.apply(app.map(insert(key))(mapper(key)(value)))(
                traversing,
            );
        }
        return traversing;
    };

export const traverseSomeWithKey =
    <T>(app: Applicative<T>) =>
    <K extends string, A, B>(
        mapper: (key: K) => (a: A) => Get1<T, Option<B>>,
    ) =>
    (ka: Record<K, A>): Get1<T, Record<K, B>> => {
        let traversing = app.pure({} as Record<K, B>);
        for (const [key, value] of Object.entries(ka) as [K, A][]) {
            traversing = app.apply(
                app.map((optB: Option<B>) => (kb: Record<K, B>): Record<K, B> =>
                    isNone(optB) ? kb : insert(key)(optB[1])(kb)
                )(
                    mapper(key)(value),
                ),
            )(traversing);
        }
        return traversing;
    };

export const scan =
    <A, V, R>(scanner: (acc: A) => (value: V) => Tuple<A, R>) =>
    (init: A) =>
    <K extends string>(m: Record<K, V>): Tuple<A, Record<K, R>> => {
        let acc = init;
        const kr = {} as Record<K, R>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            const [a, r] = scanner(acc)(value);
            kr[key] = r;
            acc = a;
        }
        return [acc, kr];
    };
export const scanWithKey = <A, K extends string, V, R>(
    scanner: (acc: A) => (key: K) => (value: V) => Tuple<A, R>,
) =>
(init: A) =>
(m: Record<K, V>): Tuple<A, Record<K, R>> => {
    let acc = init;
    const kr = {} as Record<K, R>;
    for (const [key, value] of Object.entries(m) as [K, V][]) {
        const [a, r] = scanner(acc)(key)(value);
        kr[key] = r;
        acc = a;
    }
    return [acc, kr];
};

export const mapKeys =
    <K1 extends string, K2 extends string>(mapper: (key: K1) => K2) =>
    <V>(
        m: Record<K1, V>,
    ): Record<K2, V> => {
        const k2v = {} as Record<K2, V>;
        for (const [key, value] of Object.entries(m) as [K1, V][]) {
            k2v[mapper(key)] = value;
        }
        return k2v;
    };
export const mapKeysWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K1 extends string, K2 extends string>(mapper: (key: K1) => K2) =>
    (m: Record<K1, V>): Record<K2, V> => {
        const k2v = {} as Record<K2, V>;
        for (const [key, value] of Object.entries(m) as [K1, V][]) {
            const mappedKey = mapper(key);
            k2v[mappedKey] = (mappedKey in k2v)
                ? combiner(value)(k2v[mappedKey])
                : value;
        }
        return k2v;
    };

export const foldR =
    <V, X>(folder: (item: V) => (acc: X) => X) =>
    (init: X) =>
    <K extends string>(m: Record<K, V>): X => {
        let acc = init;
        for (const value of [...Object.values<V>(m)].toReversed()) {
            acc = folder(value)(acc);
        }
        return acc;
    };
export const foldRWithKey =
    <K extends string, V, X>(folder: (key: K) => (item: V) => (acc: X) => X) =>
    (init: X) =>
    (m: Record<K, V>): X => {
        let acc = init;
        for (
            const [key, value] of [...(Object.entries(m) as [K, V][])]
                .toReversed()
        ) {
            acc = folder(key)(value)(acc);
        }
        return acc;
    };

export const foldL =
    <V, X>(folder: (acc: X) => (item: V) => X) =>
    (init: X) =>
    <K extends string>(m: Record<K, V>): X => {
        let acc = init;
        for (const value of Object.values<V>(m)) {
            acc = folder(acc)(value);
        }
        return acc;
    };
export const foldLWithKey =
    <K extends string, V, X>(folder: (key: K) => (acc: X) => (item: V) => X) =>
    (init: X) =>
    (m: Record<K, V>): X => {
        let acc = init;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            acc = folder(key)(acc)(value);
        }
        return acc;
    };

export const foldRecordWithKey =
    <M>(mon: Monoid<M>) =>
    <K extends string, V>(folder: (key: K) => (value: V) => M) =>
    (m: Record<K, V>): M => {
        let acc = mon.identity;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            acc = mon.combine(folder(key)(value), acc);
        }
        return acc;
    };

export const keys = <K extends string, V>(m: Record<K, V>): List<K> =>
    fromIterable(Object.keys(m) as K[]);
export const values = <K extends string, V>(m: Record<K, V>): List<V> =>
    fromIterable(Object.values<V>(m));
export const entries = <K extends string, V>(
    m: Record<K, V>,
): List<Tuple<K, V>> => fromIterable(Object.entries(m) as [K, V][]);

export const sortedEntries =
    <K extends string, V>(ordV: Ord<V>) =>
    (m: Record<K, V>): List<Tuple<K, V>> => {
        const entries = Object.entries(m) as [K, V][];
        entries.sort((
            [aKey, aValue],
            [bKey, bValue],
        ) => (aKey === bKey
            ? ordV.cmp(aValue, bValue)
            : stringCmp(aKey, bKey))
        );
        return fromIterable(entries);
    };

export const filter =
    <V>(pred: (value: V) => boolean) =>
    <K extends string>(m: Record<K, V>): Record<K, V> => {
        const filtered = {} as Record<K, V>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            if (pred(value)) {
                filtered[key] = value;
            }
        }
        return filtered;
    };
export const filterWithKey =
    <K extends string, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Record<K, V>): Record<K, V> => {
        const filtered = {} as Record<K, V>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            if (pred(key)(value)) {
                filtered[key] = value;
            }
        }
        return filtered;
    };

export const partition = <V>(pred: (value: V) => boolean) =>
<K extends string>(
    m: Record<K, V>,
): [satisfied: Record<K, V>, dropped: Record<K, V>] => {
    const satisfied = {} as Record<K, V>;
    const dropped = {} as Record<K, V>;
    for (const [key, value] of Object.entries(m) as [K, V][]) {
        if (pred(value)) {
            satisfied[key] = value;
        } else {
            dropped[key] = value;
        }
    }
    return [satisfied, dropped];
};
export const partitionWithKey =
    <K extends string, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Record<K, V>): [satisfied: Record<K, V>, dropped: Record<K, V>] => {
        const satisfied = {} as Record<K, V>;
        const dropped = {} as Record<K, V>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            if (pred(key)(value)) {
                satisfied[key] = value;
            } else {
                dropped[key] = value;
            }
        }
        return [satisfied, dropped];
    };

export const mapOption =
    <V, W>(mapper: (value: V) => Option<W>) =>
    <K extends string>(m: Record<K, V>): Record<K, W> => {
        const kw = {} as Record<K, W>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            const mapped = mapper(value);
            if (isSome(mapped)) {
                kw[key] = mapped[1];
            }
        }
        return kw;
    };
export const mapOptionWithKey =
    <K extends string, V, W>(mapper: (key: K) => (value: V) => Option<W>) =>
    (m: Record<K, V>): Record<K, W> => {
        const kw = {} as Record<K, W>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            const mapped = mapper(key)(value);
            if (isSome(mapped)) {
                kw[key] = mapped[1];
            }
        }
        return kw;
    };

export const mapResult =
    <V, E, W>(mapper: (value: V) => Result<E, W>) =>
    <K extends string>(
        m: Record<K, V>,
    ): [errors: Record<K, E>, oks: Record<K, W>] => {
        const errors = {} as Record<K, E>;
        const oks = {} as Record<K, W>;
        for (const [key, value] of Object.entries(m) as [K, V][]) {
            const mapped = mapper(value);
            if (isOk(mapped)) {
                oks[key] = mapped[1];
            } else {
                errors[key] = mapped[1];
            }
        }
        return [errors, oks];
    };
export const mapResultWithKey = <K extends string, V, E, W>(
    mapper: (key: K) => (value: V) => Result<E, W>,
) =>
(m: Record<K, V>): [errors: Record<K, E>, oks: Record<K, W>] => {
    const errors = {} as Record<K, E>;
    const oks = {} as Record<K, W>;
    for (const [key, value] of Object.entries(m) as [K, V][]) {
        const mapped = mapper(key)(value);
        if (isOk(mapped)) {
            oks[key] = mapped[1];
        } else {
            errors[key] = mapped[1];
        }
    }
    return [errors, oks];
};

export const isSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K extends string>(subset: Record<K, V>) =>
    (superset: Record<K, W>): boolean => {
        for (const [key, value] of Object.entries(subset) as [K, V][]) {
            if (!(key in superset)) {
                return false;
            }
            if (!equality(value)(superset[key])) {
                return false;
            }
        }
        return true;
    };
export const isSubsetOf = <V>(equality: PartialEq<V>) =>
    isSubsetOfBy((sub: V) => (sup: V) => equality.eq(sub, sup));

export const isProperSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K extends string>(subset: Record<K, V>) =>
    (superset: Record<K, W>): boolean => {
        const entries = Object.entries(subset) as [K, V][];
        for (const [key, value] of entries) {
            if (!(key in superset)) {
                return false;
            }
            if (!equality(value)(superset[key])) {
                return false;
            }
        }
        return entries.length < Object.keys(superset).length;
    };
export const isProperSubsetOf = <V>(equality: PartialEq<V>) =>
    isSubsetOfBy((sub: V) => (sup: V) => equality.eq(sub, sup));

export interface RecordHkt extends Hkt2 {
    readonly arg2: string;
    readonly type: Record<this["arg2"], this["arg1"]>;
}

export const functor = <K extends string>(): Functor<
    Apply2Only<RecordHkt, K>
> => ({ map });

export const foldable = <K extends string>(): Foldable<
    Apply2Only<RecordHkt, K>
> => ({
    foldR,
});

export const traversable = <K extends string>(): Traversable<
    Apply2Only<RecordHkt, K>
> => ({
    map,
    foldR,
    traverse,
});

export const enc = <K extends string, V>(
    encoders: Record<K, Encoder<V>>,
): Encoder<Record<K, V>> =>
(value) => {
    const entries = Object.entries(value) as [K, V][];
    return doT(monadForCodeM)
        .run(encU32Be(entries.length))
        .finishM(() =>
            foldRArray(([key, code]: [K, Code]) => (acc: Code): Code =>
                doT(monadForCodeM)
                    .addM("key", encUtf8(key))
                    .run(code)
                    .finishM(() => acc)
            )(pureCodeM([]))(entries.map((
                [key, value],
            ): [K, Code] => [key, encoders[key](value)]))
        );
};
export const dec = <K extends string, V>(
    decoders: Record<K, Decoder<V>>,
): Decoder<Record<K, V>> => {
    const go = (entries: [K, V][]) => (len: number): Decoder<Record<K, V>> =>
        len === 0
            ? pureDecoder(Object.fromEntries(entries) as Record<K, V>)
            : doT(monadForDecoder)
                .addM("key", decUtf8())
                .runWith(({ key }) =>
                    when(pureForDecoder)(!Object.hasOwn(decoders, key))(
                        failDecoder(`unknown key found: ${key}`),
                    )
                )
                .addMWith("value", ({ key }) => decoders[key as K])
                .finishM(({ key, value }) =>
                    go([...entries, [key, value] as [K, V]])(len - 1)
                );
    return flatMapDecoder(go([]))(decU32Be());
};

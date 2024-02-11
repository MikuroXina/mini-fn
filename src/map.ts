import { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import {
    cmp as listCmp,
    fromIterator,
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

export const eq =
    <K, V>(equality: PartialEq<V>) => (l: Map<K, V>, r: Map<K, V>): boolean => {
        if (l.size !== r.size) {
            return false;
        }
        for (const [leftKey, leftValue] of l) {
            const rightValue = r.get(leftKey);
            if (
                !r.has(leftKey) ||
                !equality.eq(leftValue, rightValue!)
            ) {
                return false;
            }
        }
        return true;
    };
export const partialCmp = <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) =>
(l: Map<K, V>, r: Map<K, V>): Option<Ordering> => {
    const sorter = sortedEntries(ord);
    const sortedL = sorter(l);
    const sortedR = sorter(r);
    return listPartialCmp<Tuple<K, V>>(
        tuplePartialOrd({ ordA: ord.ordK, ordB: ord.ordV }),
    )(sortedL, sortedR);
};
export const cmp = <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) =>
(l: Map<K, V>, r: Map<K, V>): Ordering => {
    const sorter = sortedEntries(ord);
    const sortedL = sorter(l);
    const sortedR = sorter(r);
    return listCmp<Tuple<K, V>>(
        tupleOrd({ ordA: ord.ordK, ordB: ord.ordV }),
    )(sortedL, sortedR);
};

export const partialEquality = fromPartialEquality(eq);
export const equality = fromEquality(eq);
export const partialOrd = fromPartialCmp(partialCmp);
export const ord = fromCmp(cmp);

export const isEmpty = <K, V>(m: Map<K, V>): boolean => m.size === 0;
export const size = <K, V>(m: Map<K, V>): number => m.size;

export const has = <K>(key: K) => <V>(m: Map<K, V>): boolean => m.has(key);
export const get = <K>(key: K) => <V>(m: Map<K, V>): Option<V> =>
    m.has(key) ? some(m.get(key)!) : none();

export const empty = <K, V>(): Map<K, V> => new Map();

export const singleton = <K>(key: K) => <V>(value: V): Map<K, V> =>
    new Map([[key, value]]);

export const fromList = <K, V>(list: List<Tuple<K, V>>): Map<K, V> => {
    const m = new Map<K, V>();
    while (!isNull(list)) {
        const [key, value] = list.current()[1]!;
        m.set(key, value);
        list = list.rest();
    }
    return m;
};
export const fromListWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(list: List<Tuple<K, V>>): Map<K, V> => {
        const m = new Map<K, V>();
        while (!isNull(list)) {
            const [key, value] = list.current()[1]!;
            if (m.has(key)) {
                m.set(key, combiner(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
            list = list.rest();
        }
        return m;
    };
export const fromListWithKey =
    <K, V>(combiner: (key: K) => (newValue: V) => (oldValue: V) => V) =>
    (list: List<Tuple<K, V>>): Map<K, V> => {
        const m = new Map<K, V>();
        while (!isNull(list)) {
            const [key, value] = list.current()[1]!;
            if (m.has(key)) {
                m.set(key, combiner(key)(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
            list = list.rest();
        }
        return m;
    };

export const fromArray = <K, V>(arr: readonly Tuple<K, V>[]): Map<K, V> => {
    const m = new Map<K, V>();
    for (const [key, value] of arr) {
        m.set(key, value);
    }
    return m;
};
export const fromArrayWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(arr: readonly Tuple<K, V>[]): Map<K, V> => {
        const m = new Map<K, V>();
        for (const [key, value] of arr) {
            if (m.has(key)) {
                m.set(key, combiner(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
        }
        return m;
    };

export const clone = <K, V>(m: Map<K, V>): Map<K, V> => new Map(m);

export const insert =
    <K>(key: K) => <V>(value: V) => (m: Map<K, V>): Map<K, V> =>
        clone(m).set(key, value);
export const insertWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(key: K) =>
    (value: V) =>
    (m: Map<K, V>): Map<K, V> => {
        const cloned = clone(m);
        if (cloned.has(key)) {
            return cloned.set(key, combiner(value)(cloned.get(key)!));
        }
        return cloned.set(key, value);
    };
export const insertWithKey =
    <K, V>(combiner: (key: K) => (newValue: V) => (oldValue: V) => V) =>
    (key: K) =>
    (value: V) =>
    (m: Map<K, V>): Map<K, V> => {
        const cloned = clone(m);
        if (cloned.has(key)) {
            return cloned.set(key, combiner(key)(value)(cloned.get(key)!));
        }
        return cloned.set(key, value);
    };

export const remove = <K>(key: K) => <V>(m: Map<K, V>): Map<K, V> => {
    if (!m.has(key)) {
        return m;
    }
    const cloned = clone(m);
    cloned.delete(key);
    return cloned;
};

export const adjust =
    <V>(mapper: (oldValue: V) => V) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const cloned = clone(m);
        return cloned.set(key, mapper(m.get(key)!));
    };
export const adjustWithKey =
    <K, V>(mapper: (key: K) => (oldValue: V) => V) =>
    (key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const cloned = clone(m);
        return cloned.set(key, mapper(key)(m.get(key)!));
    };

export const update =
    <V>(updater: (oldValue: V) => Option<V>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const toUpdate = updater(m.get(key)!);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };
export const updateWithKey =
    <K, V>(updater: (key: K) => (oldValue: V) => Option<V>) =>
    (key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const toUpdate = updater(key)(m.get(key)!);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };

export const alter =
    <V>(updater: (oldEntry: Option<V>) => Option<V>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        const toUpdate = updater(get(key)(m));
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };

export const alterF =
    <F>(f: Functor<F>) =>
    <V>(updater: (oldEntry: Option<V>) => Get1<F, Option<V>>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Get1<F, Map<K, V>> =>
        f.map((toUpdate: Option<V>) =>
            isNone(toUpdate) ? remove(key)(m) : insert(key)(toUpdate[1])(m)
        )(updater(get(key)(m)));

export const union = <K, V>(left: Map<K, V>) => (right: Map<K, V>): Map<K, V> =>
    new Map([...right, ...left]);

export const unionWith =
    <V>(combiner: (left: V) => (right: V) => V) =>
    <K>(left: Map<K, V>) =>
    (right: Map<K, V>): Map<K, V> => {
        const cloned = clone(left);
        for (const [rightKey, rightValue] of right) {
            if (cloned.has(rightKey)) {
                cloned.set(
                    rightKey,
                    combiner(cloned.get(rightKey)!)(rightValue),
                );
            } else {
                cloned.set(rightKey, rightValue);
            }
        }
        return cloned;
    };
export const unionWithKey =
    <K, V>(combiner: (key: K) => (left: V) => (right: V) => V) =>
    (left: Map<K, V>) =>
    (right: Map<K, V>): Map<K, V> => {
        const cloned = clone(left);
        for (const [rightKey, rightValue] of right) {
            if (cloned.has(rightKey)) {
                cloned.set(
                    rightKey,
                    combiner(rightKey)(cloned.get(rightKey)!)(rightValue),
                );
            } else {
                cloned.set(rightKey, rightValue);
            }
        }
        return cloned;
    };
export const unionMonoid = <K, V>(): Monoid<Map<K, V>> => ({
    identity: empty(),
    combine: (l, r) => union(l)(r),
    [semiGroupSymbol]: true,
});

export const difference =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): Map<K, V1> => {
        const cloned = clone(left);
        for (const rightKey of right.keys()) {
            cloned.delete(rightKey);
        }
        return cloned;
    };
export const differenceWith = <V1, V2 = V1>(
    combiner: (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
<K>(left: Map<K, V1>) =>
(right: Map<K, V2>): Map<K, V1> => {
    const cloned = clone(left);
    for (const [rightKey, rightValue] of right) {
        if (!cloned.has(rightKey)) {
            continue;
        }
        const toUpdate = combiner(left.get(rightKey)!)(rightValue);
        if (isNone(toUpdate)) {
            cloned.delete(rightKey);
        } else {
            cloned.set(rightKey, toUpdate[1]);
        }
    }
    return cloned;
};
export const differenceWithKey = <K, V1, V2 = V1>(
    combiner: (key: K) => (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
(left: Map<K, V1>) =>
(right: Map<K, V2>): Map<K, V1> => {
    const cloned = clone(left);
    for (const [rightKey, rightValue] of right) {
        if (!cloned.has(rightKey)) {
            continue;
        }
        const toUpdate = combiner(rightKey)(left.get(rightKey)!)(
            rightValue,
        );
        if (isNone(toUpdate)) {
            cloned.delete(rightKey);
        } else {
            cloned.set(rightKey, toUpdate[1]);
        }
    }
    return cloned;
};

export const intersection =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): Map<K, V1> => {
        const m = new Map<K, V1>();
        for (const [leftKey, leftValue] of left) {
            if (right.has(leftKey)) {
                m.set(leftKey, leftValue);
            }
        }
        return m;
    };
export const intersectionWith =
    <V1, V2 = V1, V3 = V1>(combiner: (left: V1) => (right: V2) => V3) =>
    <K>(left: Map<K, V1>) =>
    (right: Map<K, V2>): Map<K, V3> => {
        const m = new Map<K, V3>();
        for (const [leftKey, leftValue] of left) {
            if (right.has(leftKey)) {
                m.set(leftKey, combiner(leftValue)(right.get(leftKey)!));
            }
        }
        return m;
    };
export const intersectionWithKey =
    <K, V1, V2 = V1, V3 = V1>(
        combiner: (key: K) => (left: V1) => (right: V2) => V3,
    ) =>
    (left: Map<K, V1>) =>
    (right: Map<K, V2>): Map<K, V3> => {
        const m = new Map<K, V3>();
        for (const [leftKey, leftValue] of left) {
            if (right.has(leftKey)) {
                m.set(
                    leftKey,
                    combiner(leftKey)(leftValue)(right.get(leftKey)!),
                );
            }
        }
        return m;
    };

export const isDisjoint =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): boolean => {
        for (const leftKey of left.keys()) {
            if (right.has(leftKey)) {
                return false;
            }
        }
        return true;
    };

export const compose =
    <U, V>(uv: Map<U, V>) => <T>(tu: Map<T, U>): Map<T, V> => {
        const m = new Map<T, V>();
        for (const [t, u] of tu) {
            if (uv.has(u)) {
                m.set(t, uv.get(u)!);
            }
        }
        return m;
    };

export const map =
    <A, B>(mapper: (a: A) => B) => <K>(ma: Map<K, A>): Map<K, B> => {
        const mb = new Map<K, B>();
        for (const [key, value] of ma) {
            mb.set(key, mapper(value));
        }
        return mb;
    };
export const mapWithKey = <K, A, B>(mapper: (key: K) => (a: A) => B) =>
(
    ma: Map<K, A>,
): Map<K, B> => {
    const mb = new Map<K, B>();
    for (const [key, value] of ma) {
        mb.set(key, mapper(key)(value));
    }
    return mb;
};

export const traverse =
    <T>(app: Applicative<T>) =>
    <V, X>(visitor: (value: V) => Get1<T, X>) =>
    <K>(m: Map<K, V>): Get1<T, Map<K, X>> => {
        let acc = app.pure(new Map<K, X>());
        for (const [key, value] of m) {
            acc = app.apply(app.map(insert(key))(visitor(value)))(acc);
        }
        return acc;
    };

export const traverseWithKey =
    <T>(app: Applicative<T>) =>
    <K, A, B>(mapper: (key: K) => (a: A) => Get1<T, B>) =>
    (ka: Map<K, A>): Get1<T, Map<K, B>> => {
        let traversing = app.pure(new Map<K, B>());
        for (const [key, value] of ka) {
            traversing = app.apply(app.map(insert(key))(mapper(key)(value)))(
                traversing,
            );
        }
        return traversing;
    };

export const traverseSomeWithKey =
    <T>(app: Applicative<T>) =>
    <K, A, B>(mapper: (key: K) => (a: A) => Get1<T, Option<B>>) =>
    (ka: Map<K, A>): Get1<T, Map<K, B>> => {
        let traversing = app.pure(new Map<K, B>());
        for (const [key, value] of ka) {
            traversing = app.apply(
                app.map((optB: Option<B>) => (kb: Map<K, B>): Map<K, B> =>
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
    <K>(m: Map<K, V>): Tuple<A, Map<K, R>> => {
        let acc = init;
        const kr = new Map<K, R>();
        for (const [key, value] of m) {
            const [a, r] = scanner(acc)(value);
            kr.set(key, r);
            acc = a;
        }
        return [acc, kr];
    };
export const scanWithKey =
    <A, K, V, R>(scanner: (acc: A) => (key: K) => (value: V) => Tuple<A, R>) =>
    (init: A) =>
    (m: Map<K, V>): Tuple<A, Map<K, R>> => {
        let acc = init;
        const kr = new Map<K, R>();
        for (const [key, value] of m) {
            const [a, r] = scanner(acc)(key)(value);
            kr.set(key, r);
            acc = a;
        }
        return [acc, kr];
    };

export const mapKeys =
    <K1, K2>(mapper: (key: K1) => K2) => <V>(m: Map<K1, V>): Map<K2, V> => {
        const k2v = new Map<K2, V>();
        for (const [key, value] of m) {
            k2v.set(mapper(key), value);
        }
        return k2v;
    };
export const mapKeysWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K1, K2>(mapper: (key: K1) => K2) =>
    (m: Map<K1, V>): Map<K2, V> => {
        const k2v = new Map<K2, V>();
        for (const [key, value] of m) {
            const mappedKey = mapper(key);
            if (k2v.has(mappedKey)) {
                k2v.set(mappedKey, combiner(value)(k2v.get(mappedKey)!));
            } else {
                k2v.set(mappedKey, value);
            }
        }
        return k2v;
    };

export const foldR =
    <V, X>(folder: (item: V) => (acc: X) => X) =>
    (init: X) =>
    <K>(m: Map<K, V>): X => {
        let acc = init;
        for (const value of [...m.values()].toReversed()) {
            acc = folder(value)(acc);
        }
        return acc;
    };
export const foldRWithKey =
    <K, V, X>(folder: (key: K) => (item: V) => (acc: X) => X) =>
    (init: X) =>
    (m: Map<K, V>): X => {
        let acc = init;
        for (const [key, value] of [...m.entries()].toReversed()) {
            acc = folder(key)(value)(acc);
        }
        return acc;
    };

export const foldL =
    <V, X>(folder: (acc: X) => (item: V) => X) =>
    (init: X) =>
    <K>(m: Map<K, V>): X => {
        let acc = init;
        for (const value of m.values()) {
            acc = folder(acc)(value);
        }
        return acc;
    };
export const foldLWithKey =
    <K, V, X>(folder: (key: K) => (acc: X) => (item: V) => X) =>
    (init: X) =>
    (m: Map<K, V>): X => {
        let acc = init;
        for (const [key, value] of m) {
            acc = folder(key)(acc)(value);
        }
        return acc;
    };

export const foldMapWithKey =
    <M>(mon: Monoid<M>) =>
    <K, V>(folder: (key: K) => (value: V) => M) =>
    (m: Map<K, V>): M => {
        let acc = mon.identity;
        for (const [key, value] of m) {
            acc = mon.combine(folder(key)(value), acc);
        }
        return acc;
    };

export const keys = <K, V>(m: Map<K, V>): List<K> => fromIterator(m.keys());
export const values = <K, V>(m: Map<K, V>): List<V> => fromIterator(m.values());
export const entries = <K, V>(m: Map<K, V>): List<Tuple<K, V>> =>
    fromIterator(m.entries());

export const sortedEntries =
    <K, V>({ ordK, ordV }: { ordK: Ord<K>; ordV: Ord<V> }) =>
    (m: Map<K, V>): List<Tuple<K, V>> => {
        const entries = [...m];
        entries.sort((
            [aKey, aValue],
            [bKey, bValue],
        ) => (ordK.eq(aKey, bKey)
            ? ordV.cmp(aValue, bValue)
            : ordK.cmp(aKey, bKey))
        );
        return fromIterator(entries[Symbol.iterator]());
    };

export const filter =
    <V>(pred: (value: V) => boolean) => <K>(m: Map<K, V>): Map<K, V> => {
        const filtered = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(value)) {
                filtered.set(key, value);
            }
        }
        return filtered;
    };
export const filterWithKey =
    <K, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Map<K, V>): Map<K, V> => {
        const filtered = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(key)(value)) {
                filtered.set(key, value);
            }
        }
        return filtered;
    };

export const partition =
    <V>(pred: (value: V) => boolean) =>
    <K>(m: Map<K, V>): [satisfied: Map<K, V>, dropped: Map<K, V>] => {
        const satisfied = new Map<K, V>();
        const dropped = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(value)) {
                satisfied.set(key, value);
            } else {
                dropped.set(key, value);
            }
        }
        return [satisfied, dropped];
    };
export const partitionWithKey =
    <K, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Map<K, V>): [satisfied: Map<K, V>, dropped: Map<K, V>] => {
        const satisfied = new Map<K, V>();
        const dropped = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(key)(value)) {
                satisfied.set(key, value);
            } else {
                dropped.set(key, value);
            }
        }
        return [satisfied, dropped];
    };

export const mapOption =
    <V, W>(mapper: (value: V) => Option<W>) => <K>(m: Map<K, V>): Map<K, W> => {
        const kw = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(value);
            if (isSome(mapped)) {
                kw.set(key, mapped[1]);
            }
        }
        return kw;
    };
export const mapOptionWithKey =
    <K, V, W>(mapper: (key: K) => (value: V) => Option<W>) =>
    (m: Map<K, V>): Map<K, W> => {
        const kw = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(key)(value);
            if (isSome(mapped)) {
                kw.set(key, mapped[1]);
            }
        }
        return kw;
    };

export const mapResult =
    <V, E, W>(mapper: (value: V) => Result<E, W>) =>
    <K>(m: Map<K, V>): [errors: Map<K, E>, oks: Map<K, W>] => {
        const errors = new Map<K, E>();
        const oks = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(value);
            if (isOk(mapped)) {
                oks.set(key, mapped[1]);
            } else {
                errors.set(key, mapped[1]);
            }
        }
        return [errors, oks];
    };
export const mapResultWithKey =
    <K, V, E, W>(mapper: (key: K) => (value: V) => Result<E, W>) =>
    (m: Map<K, V>): [errors: Map<K, E>, oks: Map<K, W>] => {
        const errors = new Map<K, E>();
        const oks = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(key)(value);
            if (isOk(mapped)) {
                oks.set(key, mapped[1]);
            } else {
                errors.set(key, mapped[1]);
            }
        }
        return [errors, oks];
    };

export const isSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K>(subset: Map<K, V>) =>
    (superset: Map<K, W>): boolean => {
        for (const [key, value] of subset) {
            if (!superset.has(key)) {
                return false;
            }
            if (!equality(value)(superset.get(key)!)) {
                return false;
            }
        }
        return true;
    };
export const isSubsetOf = <V>(equality: PartialEq<V>) =>
    isSubsetOfBy((sub: V) => (sup: V) => equality.eq(sub, sup));

export const isProperSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K>(subset: Map<K, V>) =>
    (superset: Map<K, W>): boolean => {
        for (const [key, value] of subset) {
            if (!superset.has(key)) {
                return false;
            }
            if (!equality(value)(superset.get(key)!)) {
                return false;
            }
        }
        return subset.size < superset.size;
    };
export const isProperSubsetOf = <V>(equality: PartialEq<V>) =>
    isSubsetOfBy((sub: V) => (sup: V) => equality.eq(sub, sup));

export interface MapHkt extends Hkt2 {
    readonly type: Map<this["arg2"], this["arg1"]>;
}

export const functor = <K>(): Functor<Apply2Only<MapHkt, K>> => ({ map });

export const foldable = <K>(): Foldable<Apply2Only<MapHkt, K>> => ({ foldR });

export const traversable = <K>(): Traversable<Apply2Only<MapHkt, K>> => ({
    map,
    foldR,
    traverse,
});

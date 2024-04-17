import * as CatQueue from "./cat-queue.ts";
import type { Get1, Hkt1 } from "./hkt.ts";
import * as List from "./list.ts";
import { mapOr, mapOrElse, none, type Option, some } from "./option.ts";
import { Foldable } from "./type-class.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { monoid as endoMonoid } from "./type-class/endo.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import type { Traversable } from "./type-class/traversable.ts";

const nilNominal = Symbol("CatListNil");
export type CatNil = [typeof nilNominal];

const consNominal = Symbol("CatListCons");
export type CatCons<T> = [typeof consNominal, T, CatQueue.CatQueue<CatList<T>>];

export type CatList<T> = CatNil | CatCons<T>;

export const empty = <T>(): CatList<T> => [nilNominal];

export const singleton = <T>(
    item: T,
): CatList<T> => [consNominal, item, CatQueue.empty()];
export const pure = singleton;

export const isNull = <T>(l: CatList<T>): l is CatNil => l[0] === nilNominal;

export const length = <T>(l: CatList<T>): number =>
    Foldable.length(foldable)(l);

export const link =
    <T>(left: CatList<T>) => (right: CatList<T>): CatList<T> => {
        if (isNull(left)) {
            return right;
        }
        if (isNull(right)) {
            return right;
        }
        return [consNominal, left[1], CatQueue.appendToTail(left[2])(right)];
    };
export const append = link;

export const appendToHead = <T>(item: T): (l: CatList<T>) => CatList<T> =>
    append([consNominal, item, CatQueue.empty()]);

export const appendToTail = <T>(l: CatList<T>) => (item: T): CatList<T> =>
    append(l)([consNominal, item, CatQueue.empty()]);

export const headAndRest = <T>(
    l: CatList<T>,
): Option<readonly [T, CatList<T>]> =>
    isNull(l) ? none() : some([
        l[1],
        CatQueue.isNull(l[2]) ? empty() : foldQueue(link)(empty<T>())(l[2]),
    ]);

export const foldQueue =
    <T>(folder: (item: CatList<T>) => (acc: CatList<T>) => CatList<T>) =>
    (base: CatList<T>) =>
    (queue: CatQueue.CatQueue<CatList<T>>): CatList<T> => {
        const go =
            (xs: CatQueue.CatQueue<CatList<T>>) =>
            (ys: List.List<(l: CatList<T>) => CatList<T>>): CatList<T> =>
                mapOrElse(() =>
                    List.foldL(
                        (x: CatList<T>) => (f: (l: CatList<T>) => CatList<T>) =>
                            f(x),
                    )(base)(ys)
                )((
                    [head, rest]: readonly [
                        CatList<T>,
                        CatQueue.CatQueue<CatList<T>>,
                    ],
                ) => go(rest)(List.appendToHead(folder(head))(ys)))(
                    CatQueue.headAndRest(xs),
                );
        return go(queue)(List.empty());
    };

export const map = <T, U>(f: (t: T) => U) => (l: CatList<T>): CatList<U> => {
    if (isNull(l)) {
        return l;
    }
    const [, item, queue] = l;
    const next = CatQueue.isNull(queue)
        ? empty<T>()
        : CatQueue.foldR(link)(empty<T>())(queue);
    return appendToHead(f(item))(map(f)(next));
};

export const apply =
    <T, U>(f: CatList<(t: T) => U>) => (l: CatList<T>): CatList<U> =>
        flatMap((fn: (t: T) => U) => map(fn)(l))(f);

export const flatMap = <T, U>(
    f: (t: T) => CatList<U>,
): (l: CatList<T>) => CatList<U> => foldMap(monoid<U>())(f);

export const foldMap =
    <M>(m: Monoid<M>) => <T>(mapper: (t: T) => M) => (data: CatList<T>): M => {
        if (isNull(data)) {
            return m.identity;
        }
        const [, item, queue] = data;
        const next = CatQueue.isNull(queue)
            ? empty<T>()
            : foldQueue(link)(empty<T>())(queue);
        return m.combine(mapper(item), foldMap(m)(mapper)(next));
    };

export const foldR =
    <T, A>(folder: (item: T) => (acc: A) => A) =>
    (init: A) =>
    (data: CatList<T>): A => foldMap(endoMonoid<A>())(folder)(data)(init);

export const foldL = <T, A>(
    folder: (acc: A) => (item: T) => A,
): (init: A) => (data: CatList<T>) => A => {
    const go = (init: A) => (data: CatList<T>): A =>
        mapOr(init)(([x, xs]: readonly [T, CatList<T>]) =>
            go(folder(init)(x))(xs)
        )(headAndRest(data));
    return go;
};

export const traverse = <F>(
    app: Applicative<F>,
) =>
<A, B>(
    visitor: (a: A) => Get1<F, B>,
) =>
(data: CatList<A>): Get1<F, CatList<B>> => {
    if (isNull(data)) {
        return app.pure(empty());
    }
    const [, item, queue] = data;
    const next = CatQueue.isNull(queue)
        ? empty<A>()
        : CatQueue.foldR(link)(empty<A>())(queue);
    return app.apply(app.map(appendToHead)(visitor(item)))(
        traverse(app)(visitor)(next),
    );
};

export const monoid = <T>(): Monoid<CatList<T>> => ({
    identity: empty(),
    combine: (l, r) => append(l)(r),
    [semiGroupSymbol]: true,
});

export interface CatListHkt extends Hkt1 {
    readonly type: CatList<this["arg1"]>;
}

export const functor: Functor<CatListHkt> = { map };
export const monad: Monad<CatListHkt> = { map, pure, apply, flatMap };
export const foldable: Foldable.Foldable<CatListHkt> = { foldR };
export const traversable: Traversable<CatListHkt> = { map, foldR, traverse };

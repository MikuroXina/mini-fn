import type { Get1, Hkt1 } from "./hkt.ts";
import * as List from "./list.ts";
import { isNone, mapOrElse, none, type Option, some } from "./option.ts";
import { type Applicative, liftA2 } from "./type-class/applicative.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

export type CatQueue<T> = readonly [left: List.List<T>, right: List.List<T>];

export const empty = <T>(): CatQueue<T> => [List.empty(), List.empty()];

export const isNull = <T>(q: CatQueue<T>): boolean =>
    List.isNull(q[0]) && List.isNull(q[1]);

export const singleton = <T>(
    item: T,
): CatQueue<T> => [List.singleton(item), List.empty()];

export const length = <T>(q: CatQueue<T>): number =>
    List.length(q[0]) + List.length(q[1]);

export const appendToHead =
    <T>(item: T) => ([l, r]: CatQueue<T>): CatQueue<T> => [
        List.appendToHead(item)(l),
        r,
    ];

export const appendToTail =
    <T>([l, r]: CatQueue<T>) => (item: T): CatQueue<T> => [
        l,
        List.appendToHead(item)(r),
    ];

export const headAndRest = <T>(
    [l, r]: CatQueue<T>,
): Option<readonly [T, CatQueue<T>]> => {
    const left = List.unCons(l);
    if (isNone(left)) {
        if (List.isNull(r)) {
            return none();
        }
        return headAndRest([List.reverse(r), List.empty()]);
    }
    const [head, rest] = left[1];
    return some([head, [rest, r]]);
};

export const tailAndRest = <T>(
    [l, r]: CatQueue<T>,
): Option<readonly [T, CatQueue<T>]> => {
    const right = List.unCons(r);
    if (isNone(right)) {
        if (List.isNull(l)) {
            return none();
        }
        return tailAndRest([List.empty(), List.reverse(l)]);
    }
    const [tail, rest] = right[1];
    return some([tail, [l, rest]]);
};

export const foldR = <V, X>(
    folder: (item: V) => (acc: X) => X,
): (init: X) => (data: CatQueue<V>) => X => {
    const go = (init: X) => (data: CatQueue<V>): X =>
        mapOrElse(() => init)(
            ([tail, rest]: readonly [V, CatQueue<V>]): X =>
                go(folder(tail)(init))(rest),
        )(tailAndRest(data));
    return go;
};

export const plus = foldR(appendToHead);

export const map =
    <T, U>(f: (t: T) => U) => ([l, r]: CatQueue<T>): CatQueue<U> => [
        List.map(f)(l),
        List.map(f)(r),
    ];

export const apply =
    <T, U>(f: CatQueue<(t: T) => U>) => ([l, r]: CatQueue<T>): CatQueue<U> => [
        List.apply(f[0])(l),
        List.apply(f[1])(r),
    ];

export const flatMap =
    <T, U>(f: (t: T) => CatQueue<U>) => ([l, r]: CatQueue<T>): CatQueue<U> => [
        List.flatMap((t: T) => f(t)[0])(l),
        List.flatMap((t: T) => f(t)[1])(r),
    ];

export const traverse = <F>(
    app: Applicative<F>,
) =>
<A, B>(
    visitor: (a: A) => Get1<F, B>,
) =>
(data: CatQueue<A>): Get1<F, CatQueue<B>> =>
    app.map(plus(empty()))(
        foldR((item: A) => liftA2(app)(appendToHead)(visitor(item)))(
            app.pure(empty()),
        )(data),
    );

export const monoid = <T>(): Monoid<CatQueue<T>> => ({
    identity: empty(),
    combine: (l, r) => plus(l)(r),
    [semiGroupSymbol]: true,
});

export interface CatQueueHkt extends Hkt1 {
    readonly type: CatQueue<this["arg1"]>;
}

export const functor: Functor<CatQueueHkt> = { map };
export const monad: Monad<CatQueueHkt> = { map, pure: empty, apply, flatMap };

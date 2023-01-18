import * as Option from "./option.js";
import * as Result from "./result.js";

import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import { Monad, kleisli } from "./type-class/monad.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { Ordering, greater, less } from "./ordering.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";

import type { Applicative } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import type { Traversable } from "./type-class/traversable.js";
import type { Tuple } from "./tuple.js";

const pureNominal = Symbol("FreePure");
const nodeNominal = Symbol("FreeNode");

export type Pure<A> = readonly [typeof pureNominal, A];
export type Node<F, A> = readonly [typeof nodeNominal, Get1<F, Free<F, A>>];

export const pure = <A>(a: A): Pure<A> => [pureNominal, a];
export const node = <F, A>(f: Get1<F, Free<F, A>>): Node<F, A> => [nodeNominal, f];

export const isPure = <F, A>(free: Free<F, A>): free is Pure<A> => free[0] === pureNominal;
export const isNode = <F, A>(free: Free<F, A>): free is Node<F, A> => free[0] === nodeNominal;

export type Free<F, A> = Pure<A> | Node<F, A>;

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): boolean => {
        if (isPure(l) && isPure(r)) {
            return equalityA.eq(l[1], r[1]);
        }
        if (isNode(l) && isNode(r)) {
            return equalityFA(fromPartialEquality(() => self)()).eq(l[1], r[1]);
        }
        return false;
    };
    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): boolean => {
        if (isPure(l) && isPure(r)) {
            return equalityA.eq(l[1], r[1]);
        }
        if (isNode(l) && isNode(r)) {
            return equalityFA(fromEquality(() => self)()).eq(l[1], r[1]);
        }
        return false;
    };
    return self;
};
export const eq = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): Option.Option<Ordering> => {
        // considered that Pure is lesser than Node
        if (isPure(l)) {
            if (isPure(r)) {
                return orderA.partialCmp(l[1], r[1]);
            }
            return Option.some(less);
        }
        if (isPure(r)) {
            return Option.some(greater);
        }
        return orderFA(fromPartialCmp(() => self)()).partialCmp(l[1], r[1]);
    };
    return self;
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}) => {
    const self = (l: Free<F, A>, r: Free<F, A>): Ordering => {
        // considered that Pure is lesser than Node
        if (isPure(l)) {
            if (isPure(r)) {
                return orderA.cmp(l[1], r[1]);
            }
            return less;
        }
        if (isPure(r)) {
            return greater;
        }
        return orderFA(fromCmp(() => self)()).cmp(l[1], r[1]);
    };
    return self;
};
export const ord = fromCmp(cmp);

export const retract =
    <F extends Hkt1>(monad: Monad<F>) =>
    <T>(fr: Free<F, T>): Get1<F, T> => {
        if (isPure(fr)) {
            return monad.pure(fr[1]);
        }
        return monad.flatMap(retract(monad))(fr[1]);
    };

export const iter =
    <F extends Hkt1>(functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, T>) => T) =>
    (fr: Free<F, T>): T => {
        if (isPure(fr)) {
            return fr[1];
        }
        return fn(functor.map(iter(functor)(fn))(fr[1]));
    };
export const iterA =
    <A extends Hkt1, F extends Hkt1>(app: Applicative<A>, functor: Functor<F>) =>
    <T>(fn: (m: Get1<F, Get1<A, T>>) => Get1<A, T>) =>
    (fr: Free<F, T>): Get1<A, T> => {
        if (isPure(fr)) {
            return app.pure(fr[1]);
        }
        return fn(functor.map(iterA(app, functor)(fn))(fr[1]));
    };
export const iterM =
    <M extends Hkt1, F extends Hkt1>(monad: Monad<M>, functor: Functor<F>) =>
    <A>(fn: (fma: Get1<F, Get1<M, A>>) => Get1<M, A>) =>
    (f: Free<F, A>): Get1<M, A> => {
        if (isPure(f)) {
            return monad.pure(f[1]);
        }
        return fn(functor.map(iterM(monad, functor)(fn))(f[1]));
    };

export const hoistFree =
    <G extends Hkt1>(functor: Functor<G>) =>
    <F>(fn: <T>(f: Get1<F, T>) => Get1<G, T>) =>
    <T>(fr: Free<F, T>): Free<G, T> => {
        if (isPure(fr)) {
            return fr;
        }
        return node(functor.map(hoistFree(functor)(fn))(fn(fr[1])));
    };

export const productT =
    <F extends Hkt1>(app: Applicative<F>) =>
    <A>(a: Free<F, A>) =>
    <B>(b: Free<F, B>): Free<F, Tuple<A, B>> => {
        if (isNode(a)) {
            const mapped = app.map(productT(app))(a[1]);
            const applied = app.apply<Free<F, B>, Free<F, Tuple<A, B>>>(mapped)(app.pure(b));
            return node(applied);
        }
        if (isNode(b)) {
            return node(app.map(productT(app)(a))(b[1]));
        }
        return pure<[A, B]>([a[1], b[1]]);
    };

export const foldFree =
    <M extends Hkt1>(m: Monad<M>) =>
    <F>(fn: <T>(f: Get1<F, T>) => Get1<M, T>) =>
    <T>(fr: Free<F, T>): Get1<M, T> => {
        if (isPure(fr)) {
            return m.pure(fr[1]);
        }
        return m.flatMap(foldFree(m)(fn))(fn(fr[1]));
    };

export const liftF =
    <F extends Hkt1>(func: Functor<F>) =>
    <T>(ft: Get1<F, T>): Free<F, T> =>
        node(func.map<T, Free<F, T>>(pure)(ft));

export const mapT =
    <F extends Hkt1>(functor: Functor<F>) =>
    <T, U>(f: (t: T) => U) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return pure(f(t[1]));
        }
        return node(functor.map(mapT(functor)(f))(t[1]));
    };

export const flatMapT =
    <F extends Hkt1>(functor: Functor<F>) =>
    <T, U>(mf: (t: T) => Free<F, U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            return mf(t[1]);
        }
        return node(functor.map(flatMapT(functor)(mf))(t[1]));
    };

export const applyT =
    <F extends Hkt1>(functor: Functor<F>) =>
    <T, U>(mf: Free<F, (t: T) => U>) =>
    (t: Free<F, T>): Free<F, U> => {
        if (isPure(t)) {
            if (isPure(mf)) {
                return pure(mf[1](t[1]));
            }
            const applied = (rest: Free<F, (t: T) => U>) => applyT(functor)(rest)(t);
            return node(functor.map(applied)(mf[1]));
        }
        return node(functor.map(applyT(functor)(mf))(t[1]));
    };

export const cutoff =
    <F extends Hkt1>(functor: Functor<F>) =>
    (n: number) =>
    <T>(fr: Free<F, T>): Free<F, Option.Option<T>> => {
        if (n <= 0) {
            return pure(Option.none());
        }
        if (isNode(fr)) {
            return node(functor.map(cutoff(functor)(n - 1))(fr[1]));
        }
        const some = (x: T): Option.Option<T> => Option.some(x);
        return mapT(functor)(some)(fr);
    };

export const unfold =
    <F extends Hkt1>(functor: Functor<F>) =>
    <A, B>(fn: (b: B) => Result.Result<A, Get1<F, B>>) =>
    (seed: B): Free<F, A> =>
        Result.either((a: A): Free<F, A> => pure(a))((fb: Get1<F, B>) =>
            node(functor.map(unfold(functor)(fn))(fb)),
        )(fn(seed));
export const unfoldM =
    <F extends Hkt1, M extends Hkt1>(traversable: Traversable<F>, monad: Monad<M>) =>
    <A, B>(f: (b: B) => Get1<M, Result.Result<A, Get1<F, B>>>): ((b: B) => Get1<M, Free<F, A>>) => {
        return kleisli(monad)(f)(
            Result.either((a: A) => monad.pure(pure(a) as Free<F, A>))((fb) =>
                monad.map((ffa: Get1<F, Free<F, A>>) => node(ffa) as Free<F, A>)(
                    traversable.traverse(monad)(unfoldM(traversable, monad)(f))(fb),
                ),
            ),
        );
    };

export interface FreeHkt extends Hkt2 {
    readonly type: Free<this["arg2"], this["arg1"]>;
}

export const monad = <F extends Hkt1>(app: Applicative<F>): Monad<Apply2Only<FreeHkt, F>> => ({
    product: productT(app),
    pure,
    map: mapT(app),
    flatMap: flatMapT(app),
    apply: applyT(app),
});

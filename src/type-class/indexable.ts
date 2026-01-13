import { constant, type Fn, type FnHkt } from "../func.js";
import type { Get2 } from "../hkt.js";
import type { Profunctor } from "./profunctor.js";

export type Indexable<I, P> = Profunctor<P> & {
    readonly indexed: <A, B>(data: Get2<P, A, B>) => (index: I) => (a: A) => B;
};

export const fnIndexable = <I>(): Indexable<I, FnHkt> => ({
    indexed: constant,
    diMap:
        <A, B>(f: (a: A) => B) =>
        <C, D>(g: (c: C) => D) =>
        (m: Fn<B, C>): Fn<A, D> =>
        (a) =>
            g(m(f(a))),
});

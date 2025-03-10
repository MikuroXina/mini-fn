import { constant, type Fn, type FnHkt } from "../func.ts";
import type { Get2 } from "../hkt.ts";
import type { Profunctor } from "./profunctor.ts";

export type Indexable<I, P> = Profunctor<P> & {
    readonly indexed: <A, B>(data: Get2<P, A, B>) => (index: I) => (a: A) => B;
};

export const fnIndexable = <I>(): Indexable<I, FnHkt> => ({
    indexed: constant,
    diMap:
        <A, B>(f: (a: A) => B) =>
        <C, D>(g: (c: C) => D) =>
        (m: Fn<B, C>): Fn<A, D> =>
        (a) => g(m(f(a))),
});

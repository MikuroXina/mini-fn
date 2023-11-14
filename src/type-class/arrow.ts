import type { Get2 } from "../hkt.ts";
import type { Tuple } from "../tuple.ts";
import { type Category, pipe } from "./category.ts";

export interface Arrow<A> extends Category<A> {
    readonly arr: <B, C>(fn: (b: B) => C) => Get2<A, B, C>;
    readonly split: <B1, C1>(
        arrow1: Get2<A, B1, C1>,
    ) => <B2, C2>(
        arrow2: Get2<A, B2, C2>,
    ) => Get2<A, Tuple<B1, B2>, Tuple<C1, C2>>;
}

export const first =
    <A>(a: Arrow<A>) =>
    <B, C, D>(arrow: Get2<A, B, C>): Get2<A, Tuple<B, D>, Tuple<C, D>> =>
        a.split(arrow)(a.identity<D>());

export const second =
    <A>(a: Arrow<A>) =>
    <B, C, D>(arrow: Get2<A, B, C>): Get2<A, Tuple<D, B>, Tuple<D, C>> =>
        a.split(a.identity<D>())(arrow);

export const fanOut =
    <A>(a: Arrow<A>) =>
    <B, C1>(arrow1: Get2<A, B, C1>) =>
    <C2>(arrow2: Get2<A, B, C2>): Get2<A, B, Tuple<C1, C2>> =>
        pipe(a)(a.arr((b: B): Tuple<B, B> => [b, b]))(a.split(arrow1)(arrow2));

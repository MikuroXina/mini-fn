import type { Get2 } from "../hkt.js";
import type { Tuple } from "../tuple.js";
import { type Category, pipe } from "./category.js";

/**
 * A 2-arity kind which can split computation. It useful for receiving any composable computation.
 *
 * All instances of arrow `a` must satisfy the following laws:
 *
 * - Identity arrow: `a.arr(Func.id)` equals to `a.identity()`,
 * - Composition arrow: For all functions `f` and `g`; `a.arr(Func.compose(f)(g))` equals to `a.compose(a.arr(f))(a.arr(g))`,
 * - Left interchange: For all `f`; `a.split(a.arr(f))(a.identity())` equals to `a.arr(a.split(f)(a.identity()))`,
 * - Left composition: For all functions `f` and `g`; `a.split(Func.compose(f)(g))(a.identity())` equals to `a.compose(a.split(f)(a.identity()))(a.split(g)(a.identity()))`,
 * - Extracting first interchange: For all `f`; `a.compose(a.arr(Tuple.first))(a.split(f)(a.identity()))` equals to `a.compose(f)(a.arr(Tuple.first))`,
 * - Independence: For all `f` and `g`; `a.compose(a.arr(Func.split(Func.id)(g)))(a.split(f)(a.identity()))` equals to `a.compose(a.split(f)(a.identity()))(a.arr(Func.split(Func.id)(g)))`,
 * - Idempotence: `a.compose(a.arr(Tuple.assocR))(a.split(a.split(f)(a.identity()))(a.identity()))` equals to `a.compose(a.split(f)(a.identity()))(a.arr(Tuple.assocR))`.
 */
export type Arrow<A> = Category<A> & {
    /**
     * Lifts a function to an arrow.
     *
     * @param fn - The function to be lifted.
     * @returns The new arrow.
     */
    readonly arr: <B, C>(fn: (b: B) => C) => Get2<A, B, C>;
    /**
     * Splits two inputs between two arrows.
     *
     * @param arrow1 - The arrow to be mapped on the first.
     * @param arrow2 - The arrow to be mapped on the second.
     * @returns The composed arrow.
     */
    readonly split: <B1, C1>(
        arrow1: Get2<A, B1, C1>,
    ) => <B2, C2>(
        arrow2: Get2<A, B2, C2>,
    ) => Get2<A, Tuple<B1, B2>, Tuple<C1, C2>>;
};

/**
 * Embeds the arrow as a first path into a new one.
 *
 * ```text
 *      |---------------|
 * B -->|-->[ arrow ]-->|--> C
 *      |               |
 * D -->|-------------->|--> D
 *      |---------------|
 * ```
 *
 * @param a - The `Arrow` instance for `A`.
 * @param arrow - The arrow to be mapped.
 * @returns The arrow appended a secondary path `D`.
 */
export const first =
    <A>(a: Arrow<A>) =>
    <B, C, D>(arrow: Get2<A, B, C>): Get2<A, Tuple<B, D>, Tuple<C, D>> =>
        a.split(arrow)(a.identity<D>());

/**
 * Embeds the arrow as a second path into a new one.
 *
 * ```text
 *      |---------------|
 * D -->|-------------->|--> D
 *      |               |
 * B -->|-->[ arrow ]-->|--> C
 *      |---------------|
 * ```
 *
 * @param a - The `Arrow` instance for `A`.
 * @param arrow - The arrow to be mapped.
 * @returns The arrow appended a primary path `D`.
 */
export const second =
    <A>(a: Arrow<A>) =>
    <B, C, D>(arrow: Get2<A, B, C>): Get2<A, Tuple<D, B>, Tuple<D, C>> =>
        a.split(a.identity<D>())(arrow);

/**
 * Sends the input to both arrows and packs their output.
 *
 * ```text
 *      |-------------------|
 *      |  |-->[ arrow1 ]-->|--> C1
 * B -->|--|                |
 *      |  |-->[ arrow2 ]-->|--> C2
 *      |-------------------|
 * ```
 *
 * @param a - The `Arrow` instance for `A`.
 * @param arrow1 - The arrow used on the first item.
 * @param arrow2 - The arrow used on the second item.
 * @returns The joined arrow.
 */
export const fanOut =
    <A>(a: Arrow<A>) =>
    <B, C1>(arrow1: Get2<A, B, C1>) =>
    <C2>(arrow2: Get2<A, B, C2>): Get2<A, B, Tuple<C1, C2>> =>
        pipe(a)(a.arr((b: B): Tuple<B, B> => [b, b]))(a.split(arrow1)(arrow2));

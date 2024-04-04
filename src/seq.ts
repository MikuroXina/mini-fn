import {
    type Serial,
    type Serialize,
    serializeMonad,
    type Serializer,
} from "./serialize.ts";
import type { Hkt1 } from "./hkt.ts";
import { isNone, map as mapOption, none, type Option, some } from "./option.ts";
import {
    deep,
    type Digit,
    empty,
    type FingerTree,
    fromReduce,
    isEmpty,
    isSingle,
    type Node,
    reduceDigit,
    reduceTree,
    size,
} from "./seq/finger-tree.ts";
import type { Tuple } from "./tuple.ts";
import { doT } from "./cat.ts";

/**
 * The sequence of `A`, the homogenous data structure to store finite data. This is an alias of `FingerTree`.
 */
export type Seq<A> = FingerTree<A>;

export interface SeqHkt extends Hkt1 {
    readonly type: Seq<this["arg1"]>;
}

export {
    appendBetween,
    appendManyToHead,
    appendManyToTail,
    appendToHead,
    appendToTail,
    concat,
    deep,
    empty,
    fromArray,
    fromReduce,
    isEmpty,
    size,
} from "./seq/finger-tree.ts";

/**
 * The view of the left end of a `Seq`.
 */
export type ViewL<A> = Option<Tuple<A, Seq<A>>>;

const deepL =
    <A>(viewer: (tree: Seq<Node<A>>) => ViewL<Node<A>>) =>
    (left: readonly A[]) =>
    (tree: Seq<Node<A>>) =>
    (right: Digit<A>): Seq<A> => {
        if (4 < left.length) {
            throw new Error("digit overflow");
        }
        if (left.length === 0) {
            const subView = viewer(tree);
            if (isNone(subView)) {
                return fromReduce(reduceDigit)(right);
            }
            const [first, subTree] = subView[1];
            return deep(first)(subTree)(right);
        }
        return deep(left as Digit<A>)(tree)(right);
    };

/**
 * Creates the new view of the left end of `tree`.
 *
 * @param tree - The source tree.
 * @returns The view of the left end.
 */
export const viewL = <A>(tree: Seq<A>): ViewL<A> => {
    if (isEmpty(tree)) {
        return none();
    }
    if (isSingle(tree)) {
        return some([tree.data, empty]);
    }
    const { left, nextTree, right } = tree;
    const [head, ...rest] = left;
    return some([head, deepL(viewL<Node<A>>)(rest)(nextTree)(right)]);
};

/**
 * Gets the leftmost head of the tree.
 *
 * @param tree - The tree to get the head.
 * @returns The leftmost head.
 */
export const headL = <A>(tree: Seq<A>): Option<A> =>
    mapOption(([head]: Tuple<A, Seq<A>>) => head)(viewL(tree));
/**
 * Gets the tree without the leftmost head.
 *
 * @param tree - The tree to get the tail.
 * @returns The tree without the leftmost head.
 */
export const tailL = <A>(tree: Seq<A>): Option<Seq<A>> =>
    mapOption(([, tail]: Tuple<A, Seq<A>>) => tail)(viewL(tree));

/**
 * The view of the right end of a `Seq`.
 */
export type ViewR<A> = Option<Tuple<Seq<A>, A>>;

const deepR =
    <A>(viewer: (tree: Seq<Node<A>>) => ViewR<Node<A>>) =>
    (left: Digit<A>) =>
    (tree: Seq<Node<A>>) =>
    (right: readonly A[]): Seq<A> => {
        if (4 < right.length) {
            throw new Error("digit overflow");
        }
        if (right.length === 0) {
            const subView = viewer(tree);
            if (isNone(subView)) {
                return fromReduce(reduceDigit)(left);
            }
            const [subTree, last] = subView[1];
            return deep(left)(subTree)(last);
        }
        return deep(left)(tree)(right as Digit<A>);
    };

/**
 * Creates the new view of the right end of `tree`.
 *
 * @param tree - The source tree.
 * @returns The view of the right end.
 */
export const viewR = <A>(tree: Seq<A>): ViewR<A> => {
    if (isEmpty(tree)) {
        return none();
    }
    if (isSingle(tree)) {
        return some([empty, tree.data]);
    }
    const { left, nextTree, right } = tree;
    const tail = right.at(-1) as A;
    const rest = right.slice(0, -1) as A[];
    return some([deepR(viewR<Node<A>>)(left)(nextTree)(rest), tail]);
};

/**
 * Gets the rightmost head of the tree.
 *
 * @param tree - The tree to get the head.
 * @returns The rightmost head.
 */
export const headR = <A>(tree: Seq<A>): Option<A> =>
    mapOption(([, head]: Tuple<Seq<A>, A>) => head)(viewR(tree));
/**
 * Gets the tree without the rightmost head.
 *
 * @param tree - The tree to get the tail.
 * @returns The tree without the rightmost head.
 */
export const tailR = <A>(tree: Seq<A>): Option<Seq<A>> =>
    mapOption(([tail]: Tuple<Seq<A>, A>) => tail)(viewR(tree));

export const serialize =
    <A>(serializeA: Serialize<A>): Serialize<Seq<A>> =>
    <S>(v: Seq<A>) =>
    (ser: Serializer<S>): Serial<S> => {
        const cat = doT(serializeMonad<S>()).addM(
            "seqSer",
            ser.serializeArray(size(v)),
        );
        return reduceTree
            .reduceL((prev: typeof cat) => (item: A): typeof cat =>
                prev.addMWith(
                    "_",
                    ({ seqSer }) => seqSer.serializeElement(serializeA)(item),
                )
            )(cat)(v)
            .addMWith("end", ({ seqSer }) => seqSer.end())
            .finish(({ end }) => end) as Serial<S>;
    };

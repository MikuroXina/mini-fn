import {
    deep,
    Digit,
    empty,
    FingerTree,
    fromReduce,
    isEmpty,
    isSingle,
    Node,
    reduceDigit,
} from "./seq/finger-tree.js";

import { isNone, map as mapOption, none, Option, some } from "./option.js";
import type { Tuple } from "./tuple.js";

export type Seq<A> = FingerTree<A>;

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
} from "./seq/finger-tree.js";

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

export const headL = <A>(tree: Seq<A>): Option<A> =>
    mapOption(([head]: Tuple<A, Seq<A>>) => head)(viewL(tree));
export const tailL = <A>(tree: Seq<A>): Option<Seq<A>> =>
    mapOption(([, tail]: Tuple<A, Seq<A>>) => tail)(viewL(tree));

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

export const headR = <A>(tree: Seq<A>): Option<A> =>
    mapOption(([, head]: Tuple<Seq<A>, A>) => head)(viewR(tree));
export const tailR = <A>(tree: Seq<A>): Option<Seq<A>> =>
    mapOption(([tail]: Tuple<Seq<A>, A>) => tail)(viewR(tree));
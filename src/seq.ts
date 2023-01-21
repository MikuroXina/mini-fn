import {
    FingerTree,
    Node,
    isEmpty,
    size,
    deep,
    Digit,
    empty,
    fromReduce,
    isSingle,
    reduceDigit,
} from "./seq/finger-tree.js";

import { Option, none, some, isNone, map as mapOption } from "./option.js";
import type { Tuple } from "./tuple.js";

export type Seq<A> = FingerTree<A>;

export { isEmpty, size };

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

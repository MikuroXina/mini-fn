import type { Get1, Hkt1 } from "../hkt.js";
import { flip, id } from "../func.js";

import type { Reduce } from "../type-class/reduce.js";
import { reduce as reduceArray } from "../array.js";

const emptyNominal = Symbol("FingerTreeEmpty");
export interface Empty {
    readonly type: typeof emptyNominal;
}
export const isEmpty = <A>(tree: FingerTree<A>): tree is Empty => tree.type === emptyNominal;
export const empty: Empty = { type: emptyNominal } as const;

const singleNominal = Symbol("FingerTreeSingle");
export interface Single<A> {
    readonly type: typeof singleNominal;
    data: A;
}
export const isSingle = <A>(tree: FingerTree<A>): tree is Single<A> => tree.type === singleNominal;

export type Digit<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];

export interface DigitHkt extends Hkt1 {
    readonly type: Digit<this["arg1"]>;
}

export const reduceDigit: Reduce<DigitHkt> = {
    reduceR: (red) => (a) => (b) => {
        if (a.length === 1) {
            return red(a[0])(b);
        }
        const [a1, ...as] = a;
        return reduceDigit.reduceR(red)(as)(red(a1)(b));
    },
    reduceL:
        <A, B>(red: (b: B) => (a: A) => B) =>
        (b: B) =>
        (a: Digit<A>): B => {
            if (a.length === 1) {
                return red(b)(a[0]);
            }
            const as = a.slice(0, -1) as Digit<A>;
            const aLast = a.at(-1) as A;
            return reduceDigit.reduceL(red)(red(b)(aLast))(as);
        },
};

export type Node<A> = [A, A] | [A, A, A];

export interface NodeHkt extends Hkt1 {
    readonly type: Node<this["arg1"]>;
}

export const reduceNode: Reduce<NodeHkt> = {
    reduceR: (red) => (a) => (b) =>
        a.length === 2 ? red(a[0])(red(a[1])(b)) : red(a[0])(red(a[1])(red(a[2])(b))),
    reduceL: (red) => (b) => (a) =>
        a.length === 2 ? red(red(b)(a[0]))(a[1]) : red(red(red(b)(a[0]))(a[1]))(a[2]),
};

const deepNominal = Symbol("FingerTreeDeep");
export interface Deep<A> {
    readonly type: typeof deepNominal;
    left: Digit<A>;
    nextTree: FingerTree<Node<A>>;
    right: Digit<A>;
}
export const isDeep = <A>(tree: FingerTree<A>): tree is Deep<A> => tree.type === deepNominal;

export const size = <A>(tree: FingerTree<A>): number => {
    if (isEmpty(tree)) {
        return 0;
    }
    if (isSingle(tree)) {
        return 1;
    }
    return tree.left.length + size(tree.nextTree) + tree.right.length;
};

export const deep =
    <A>(left: Digit<A>) =>
    (tree: FingerTree<Node<A>>) =>
    (right: Digit<A>): FingerTree<A> => ({
        type: deepNominal,
        left,
        nextTree: tree,
        right,
    });

export type FingerTree<A> = Empty | Single<A> | Deep<A>;

export interface FingerTreeHkt extends Hkt1 {
    readonly type: FingerTree<this["arg1"]>;
}

export const reduceTree: Reduce<FingerTreeHkt> = {
    reduceR:
        <A, B>(reducer: (a: A) => (b: B) => B) =>
        (tree: FingerTree<A>): ((b: B) => B) => {
            if (isEmpty(tree)) {
                return id;
            }
            if (isSingle(tree)) {
                return reducer(tree.data);
            }
            const { left, nextTree, right } = tree;
            const reducerReducer = reduceDigit.reduceR(reducer);
            const reducerReducerReducer = reduceTree.reduceR(reducerReducer);
            return (b: B) =>
                reducerReducer(left)(reducerReducerReducer(nextTree)(reducerReducer(right)(b)));
        },
    reduceL:
        <A, B>(reducer: (b: B) => (a: A) => B) =>
        (b: B) =>
        (tree: FingerTree<A>): B => {
            if (isEmpty(tree)) {
                return b;
            }
            if (isSingle(tree)) {
                return reducer(b)(tree.data);
            }
            const { left, nextTree, right } = tree;
            const reducerReducer = reduceDigit.reduceL(reducer);
            const reducerReducerReducer = reduceTree.reduceL(reducerReducer);
            return reducerReducer(reducerReducerReducer(reducerReducer(b)(right))(nextTree))(left);
        },
};

export const appendToHead =
    <A>(elem: A) =>
    (tree: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(tree)) {
            return { type: singleNominal, data: elem };
        }
        if (isSingle(tree)) {
            return deep([elem])(empty)([tree.data]);
        }
        if (tree.left.length === 4) {
            const [l1, l2, l3, l4] = tree.left;
            return {
                type: deepNominal,
                left: [elem, l1],
                nextTree: appendToHead([l2, l3, l4] as Node<A>)(tree.nextTree),
                right: tree.right,
            };
        }
        return {
            ...tree,
            type: deepNominal,
            left: [elem, ...tree.left],
        };
    };
export const pushToHead = flip(appendToHead);
export const appendManyToHead = <F>(
    reduce: Reduce<F>,
): (<A>(fa: Get1<F, A>) => (tree: FingerTree<A>) => FingerTree<A>) => reduce.reduceR(appendToHead);

export const appendToTail =
    <A>(elem: A) =>
    (tree: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(tree)) {
            return { type: singleNominal, data: elem };
        }
        if (isSingle(tree)) {
            return deep([tree.data])(empty)([elem]);
        }
        if (tree.right.length === 4) {
            const [r1, r2, r3, r4] = tree.right;
            return {
                type: deepNominal,
                left: tree.left,
                nextTree: appendToTail([r1, r2, r3] as Node<A>)(tree.nextTree),
                right: [r4, elem],
            };
        }
        return {
            ...tree,
            type: deepNominal,
            right: [...tree.right, elem],
        };
    };
export const pushToTail = flip(appendToTail);
export const appendManyToTail = <F>(
    reduce: Reduce<F>,
): (<A>(tree: FingerTree<A>) => (fa: Get1<F, A>) => FingerTree<A>) => reduce.reduceL(pushToTail);

export const fromReduce =
    <F>(reduce: Reduce<F>) =>
    <A>(fa: Get1<F, A>): FingerTree<A> =>
        appendManyToHead(reduce)(fa)(empty);

const nodes = <A>(middle: readonly A[]): Node<A>[] => {
    if (middle.length < 2) {
        throw new Error("not enough digit");
    }
    switch (middle.length) {
        case 2:
        case 3:
            return [middle as Node<A>];
        case 4: {
            const [a, b, c, d] = middle;
            return [
                [a, b],
                [c, d],
            ];
        }
        default: {
            const [a, b, c, ...rest] = middle;
            return [[a, b, c], ...nodes(rest)];
        }
    }
};

export const appendBetween =
    <A>(left: FingerTree<A>) =>
    (middle: readonly A[]) =>
    (right: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(left)) {
            return appendManyToHead(reduceArray)(middle)(right);
        }
        if (isEmpty(right)) {
            return appendManyToTail(reduceArray)(left)(middle);
        }
        if (isSingle(left)) {
            return appendToHead(left.data)(appendManyToHead(reduceArray)(middle)(right));
        }
        if (isSingle(right)) {
            return appendToTail(right.data)(appendManyToTail(reduceArray)(left)(middle));
        }
        return deep(left.left)(
            appendBetween(left.nextTree)(nodes([...left.right, ...middle, ...right.left]))(
                right.nextTree,
            ),
        )(right.right);
    };

export const concat =
    <A>(left: FingerTree<A>) =>
    (right: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(left)) {
            return right;
        }
        if (isEmpty(right)) {
            return left;
        }
        if (isSingle(left)) {
            return appendToHead(left.data)(right);
        }
        if (isSingle(right)) {
            return appendToTail(right.data)(left);
        }
        return appendBetween(left)([])(right);
    };

import { assertEquals } from "std/assert/mod.ts";
import { reduce as reduceArray } from "../array.ts";
import { flip, id } from "../func.ts";
import type { Get1, Hkt1 } from "../hkt.ts";
import type { Reduce } from "../type-class/reduce.ts";
import * as Array from "../array.ts";

const emptyNominal = Symbol("FingerTreeEmpty");
/**
 * A tree has no elements.
 */
export interface Empty {
    readonly type: typeof emptyNominal;
}
/**
 * Checks whether the tree is an `Empty`.
 *
 * @param tree - The tree to be checked.
 * @returns Whether the tree is an `Empty`.
 */
export const isEmpty = <A>(tree: FingerTree<A>): tree is Empty =>
    tree.type === emptyNominal;
/**
 * A new empty tree.
 */
export const empty: Empty = { type: emptyNominal } as const;

const singleNominal = Symbol("FingerTreeSingle");
/**
 * A tree has an one element.
 */
export interface Single<A> {
    readonly type: typeof singleNominal;
    data: A;
}
/**
 * Checks whether the tree is a `Single`.
 *
 * @param tree - The tree to be checked.
 * @returns Whether the tree is a `Single`.
 */
export const isSingle = <A>(tree: FingerTree<A>): tree is Single<A> =>
    tree.type === singleNominal;
/**
 * Creates a new single tree contains only one element.
 *
 * @param data - The data to be contained.
 * @returns The new `Single`.
 */
export const single = <A>(data: A): Single<A> => ({
    type: singleNominal,
    data,
});

/**
 * A root of subtree.
 */
export type Digit<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];

export interface DigitHkt extends Hkt1 {
    readonly type: Digit<this["arg1"]>;
}

/**
 * The instance of `Reduce` for `Digit`.
 */
export const reduceDigit: Reduce<DigitHkt> = reduceArray;

/**
 * A leaf of subtree.
 */
export type Node<A> = [A, A] | [A, A, A];

export interface NodeHkt extends Hkt1 {
    readonly type: Node<this["arg1"]>;
}

/**
 * The instance of `Reduce` for `Node`.
 */
export const reduceNode: Reduce<NodeHkt> = {
    reduceR: (red) => (a) => (b) =>
        a.length === 2
            ? red(a[0])(red(a[1])(b))
            : red(a[0])(red(a[1])(red(a[2])(b))),
    reduceL: (red) => (b) => (a) =>
        a.length === 2
            ? red(red(b)(a[0]))(a[1])
            : red(red(red(b)(a[0]))(a[1]))(a[2]),
};

const deepNominal = Symbol("FingerTreeDeep");
/**
 * A tree has children subtrees and a next tree.
 */
export interface Deep<A> {
    readonly type: typeof deepNominal;
    left: Digit<A>;
    nextTree: FingerTree<Node<A>>;
    right: Digit<A>;
}
/**
 * Checks whether the tree is a `Deep`.
 *
 * @param tree - The tree to be checked.
 * @returns Whether the tree is a `Deep`.
 */
export const isDeep = <A>(tree: FingerTree<A>): tree is Deep<A> =>
    tree.type === deepNominal;
/**
 * Creates the tree from subtrees.
 *
 * @param left - The left subtree.
 * @param tree - The next tree has children.
 * @param right - The right subtree.
 * @returns The new tree.
 */
export const deep =
    <A>(left: Digit<A>) =>
    (tree: FingerTree<Node<A>>) =>
    (right: Digit<A>): FingerTree<A> => ({
        type: deepNominal,
        left,
        nextTree: tree,
        right,
    });

Deno.test("type check", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    assertEquals(isEmpty(emptiness), true);
    assertEquals(isEmpty(single), false);
    assertEquals(isEmpty(many), false);

    assertEquals(isSingle(emptiness), false);
    assertEquals(isSingle(single), true);
    assertEquals(isSingle(many), false);

    assertEquals(isDeep(emptiness), false);
    assertEquals(isDeep(single), false);
    assertEquals(isDeep(many), true);
});

/**
 * Counts the number of elements in the tree.
 *
 * @param tree - to count elements.
 * @returns The number of elements in the tree.
 */
export const size = <A>(tree: FingerTree<A>): number => {
    if (isEmpty(tree)) {
        return 0;
    }
    if (isSingle(tree)) {
        return 1;
    }
    return tree.left.length + size(tree.nextTree) + tree.right.length;
};

Deno.test("size", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    assertEquals(size(emptiness), 0);
    assertEquals(size(single), 1);
    assertEquals(size(many), 5);
});

/**
 * A tree data structure that can be accessed to the *fingers* in amortized constant time. Concatenating and splitting the data will be done in logarithmic time.
 */
export type FingerTree<A> = Empty | Single<A> | Deep<A>;

export interface FingerTreeHkt extends Hkt1 {
    readonly type: FingerTree<this["arg1"]>;
}

/**
 * The instance of `Reduce` for `FingerTree`.
 */
export const reduceTree: Reduce<FingerTreeHkt> = {
    reduceR:
        <A, B>(reducer: (a: A) => (b: B) => B) =>
        (tree: FingerTree<A>): (b: B) => B => {
            if (isEmpty(tree)) {
                return id;
            }
            if (isSingle(tree)) {
                return reducer(tree.data);
            }
            const { left, nextTree, right } = tree;
            const arrayReducer = reduceArray.reduceR(reducer);
            const treeArrayReducer = reduceTree.reduceR(arrayReducer);
            return (b: B) =>
                arrayReducer(left)(
                    treeArrayReducer(nextTree)(arrayReducer(right)(b)),
                );
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
            const arrayReducer = reduceArray.reduceL(reducer);
            const treeArrayReducer = reduceTree.reduceL(arrayReducer);
            return arrayReducer(
                treeArrayReducer(arrayReducer(b)(left))(nextTree),
            )(right);
        },
};

/**
 * Appends the element to the head on the tree.
 *
 * @param elem - The element to be appended.
 * @param tree - The target tree.
 * @returns The mutated tree.
 */
export const appendToHead =
    <A>(elem: A) => (tree: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(tree)) {
            return single(elem);
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
/**
 * Appends the element to the head on the tree.
 *
 * @param tree - The target tree.
 * @param elem - The element to be appended.
 * @returns The mutated tree.
 */
export const pushToHead = flip(appendToHead);
/**
 * Appends the elements to the head on the tree.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The container having elements by `F`.
 * @param tree - The target tree.
 * @returns The mutated tree.
 */
export const appendManyToHead = <F>(
    reduce: Reduce<F>,
): <A>(fa: Get1<F, A>) => (tree: FingerTree<A>) => FingerTree<A> =>
    reduce.reduceR(appendToHead);

/**
 * Appends the element to the tail on the tree.
 *
 * @param elem - The element to be appended.
 * @param tree - The target tree.
 * @returns The mutated tree.
 */
export const appendToTail =
    <A>(elem: A) => (tree: FingerTree<A>): FingerTree<A> => {
        if (isEmpty(tree)) {
            return single(elem);
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
/**
 * Appends the element to the tail on the tree.
 *
 * @param tree - The target tree.
 * @param elem - The element to be appended.
 * @returns The mutated tree.
 */
export const pushToTail = flip(appendToTail);
/**
 * Appends the elements to the tail on the tree.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The container having elements by `F`.
 * @param tree - The target tree.
 * @returns The mutated tree.
 */
export const appendManyToTail = <F>(
    reduce: Reduce<F>,
): <A>(tree: FingerTree<A>) => (fa: Get1<F, A>) => FingerTree<A> =>
    reduce.reduceL(pushToTail);

/**
 * Creates a new tree from the elements in `fa`.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The container having elements by `F`.
 * @returns The new tree.
 */
export const fromReduce =
    <F>(reduce: Reduce<F>) => <A>(fa: Get1<F, A>): FingerTree<A> =>
        appendManyToTail(reduce)(empty as FingerTree<A>)(fa);
/**
 * Creates a new tree from the elements in `Array`.
 *
 * @param fa - The elements to be constructed as a tree.
 * @returns The new tree.
 */
export const fromArray = fromReduce(reduceArray);

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

/**
 * Appends the elements between the trees.
 *
 * @param left - The left-side tree.
 * @param middle - The elements array to be appended.
 * @param right - The right-side tree.
 * @returns The new tree.
 */
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
            return appendToHead(left.data)(
                appendManyToHead(reduceArray)(middle)(right),
            );
        }
        if (isSingle(right)) {
            return appendToTail(right.data)(
                appendManyToTail(reduceArray)(left)(middle),
            );
        }
        return deep(left.left)(
            appendBetween(left.nextTree)(
                nodes([...left.right, ...middle, ...right.left]),
            )(
                right.nextTree,
            ),
        )(right.right);
    };

/**
 * Concatenates two trees.
 *
 * @param left - The left-side tree.
 * @param right - The right-side tree.
 * @returns The concatenated tree.
 */
export const concat =
    <A>(left: FingerTree<A>) => (right: FingerTree<A>): FingerTree<A> => {
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

Deno.test("concat", () => {
    const toArray = Array.fromReduce(reduceTree);

    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 2, 8]);

    assertEquals(toArray(concat(emptiness)(emptiness)), []);

    assertEquals(toArray(concat(emptiness)(single)), [3]);
    assertEquals(toArray(concat(single)(emptiness)), [3]);

    assertEquals(toArray(concat(single)(single)), [3, 3]);

    assertEquals(toArray(concat(emptiness)(many)), [2, 1, 8, 2, 8]);
    assertEquals(toArray(concat(many)(emptiness)), [2, 1, 8, 2, 8]);

    assertEquals(toArray(concat(single)(many)), [3, 2, 1, 8, 2, 8]);
    assertEquals(toArray(concat(many)(single)), [2, 1, 8, 2, 8, 3]);

    assertEquals(toArray(concat(many)(many)), [
        2,
        1,
        8,
        2,
        8,
        2,
        1,
        8,
        2,
        8,
    ]);
});

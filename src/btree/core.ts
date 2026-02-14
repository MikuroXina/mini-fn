/**
 * A B-tree (this custom) must maintain the following invariants:
 *
 * 1. Leaf nodes are at the same depth.
 * 2. Keys of each node are stored in the ascending order by `Ord` instance for `K`.
 * 3. Intermediate nodes have at least 6 children.
 * 4. Every nodes except root have at least 5 keys.
 * 5. Root node has no children or at least 2 children.
 * 6. A non-leaf node with `k` keys contains `k + 1` children.
 */

import * as Option from "../option.js";
import { equal, greater, less, type Ordering } from "../ordering.js";
import * as Result from "../result.js";
import type { Ord } from "../type-class/ord.js";

/** node split anchor */
const B = 6;
/** entries max */
const CAPACITY = (2 * B - 1) as 11;

export type Leaf<K, V> = {
    /**
     * Inserted comparable keys padded to the left. It has at most `CAPACITY` items and not empty.
     */
    keys: K[];
    /**
     * Inserted values associated to `keys`. It has at most `CAPACITY` items and not empty.
     */
    values: V[];
    /**
     * Children nodes for discriminant union of `Node`.
     */
    edges: null;
};

export type Internal<K, V> = {
    /**
     * Inserted comparable keys padded to the left. It has at most `CAPACITY` items and not empty.
     */
    keys: K[];
    /**
     * Inserted values associated to `keys`. It has at most `CAPACITY` items and not empty.
     */
    values: V[];
    /**
     * Children nodes padded to the left. It has `entries.length + 1` items.
     */
    edges: Node<K, V>[];
};

export type Node<K, V> = Leaf<K, V> | Internal<K, V>;

//
// Core methods
//

/**
 * Creates a new empty `Tree<K, V>`.
 */
export const empty = <K, V>(): Node<K, V> => ({
    keys: [],
    values: [],
    edges: null,
});

/**
 * Checks whether the node is a leaf, has no children.
 *
 * @param node - To be checked.
 * @returns Whether the node has no children.
 */
export const isLeaf = <K, V>(node: Node<K, V>): node is Leaf<K, V> =>
    node.edges === null;

/**
 * Replaces the item at `index` in `array` with `newValue` and returns the old one.
 *
 * @param array - To modify.
 * @param index - Specifying the position.
 * @param newValue - Replacing new item.
 * @returns The replaced old item.
 */
const replace = <T>(
    array: readonly T[],
    index: number,
    newValue: T,
): [T[], T] => [array.with(index, newValue), array[index]!];

/**
 * Splits the child note into two nodes at `childIndex` in `parent`.
 *
 * @param parent - Node to split.
 * @param childIndex - Index of the child to split.
 * @returns A new modified node.
 */
export const splitChild = <K, V>(
    parent: Internal<K, V>,
    childIndex: number,
): [left: Node<K, V>, newParent: Internal<K, V>, right: Node<K, V>] => {
    const child = parent.edges[childIndex]!;
    if (!isFull(child)) {
        throw new Error("expected node with full entries");
    }

    const anchor = B - 1;
    const left = {
        keys: child.keys.slice(0, anchor),
        values: child.values.slice(0, anchor),
        edges: child.edges?.slice(0, anchor + 1) ?? null,
    };
    const centerKey = child.keys[anchor]!;
    const centerValue = child.values[anchor]!;
    const right = {
        keys: child.keys.slice(anchor + 1),
        values: child.values.slice(anchor + 1),
        edges: child.edges?.slice(anchor + 1) ?? null,
    };

    return [
        left,
        {
            keys: parent.keys.toSpliced(childIndex, 0, centerKey),
            values: parent.values.toSpliced(childIndex, 0, centerValue),
            edges: parent.edges.toSpliced(childIndex, 1, left, right),
        },
        right,
    ];
};

/**
 * Checks whether the node is full of the capacity.
 */
export const isFull = <K, V>(node: Node<K, V>): boolean =>
    node.keys.length >= CAPACITY;

/**
 * Inserts the key-value entry to the node by `K`'s order.
 *
 * @param node - To modify.
 * @param ord - Insertion order.
 * @param key - To be inserted.
 * @param value - To be inserted.
 * @returns The modified `node`.
 */
export const insertNotFull = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
    key: K,
    value: V,
): [Node<K, V>, Option.Option<V>] => {
    if (isFull(node)) {
        throw new Error("expected `node` is not full");
    }

    for (let i = 0; i < node.keys.length; ++i) {
        switch (ord.cmp(key, node.keys[i]!)) {
            case less: {
                if (isLeaf(node)) {
                    return [
                        {
                            keys: node.keys.toSpliced(i, 0, key),
                            values: node.values.toSpliced(i, 0, value),
                            edges: null,
                        },
                        Option.none(),
                    ];
                }
                return insertIntoChild(node, ord, i, key, value);
            }
            case equal:
                return [
                    {
                        ...node,
                        values: node.values.with(i, value),
                    },
                    Option.some(node.values[i]!),
                ];
            case greater:
                break;
        }
    }
    if (isLeaf(node)) {
        return [
            {
                keys: node.keys.toSpliced(node.keys.length, 0, key),
                values: node.values.toSpliced(node.values.length, 0, value),
                edges: null,
            },
            Option.none(),
        ];
    }
    return insertIntoChild(node, ord, node.edges.length - 1, key, value);
};

/**
 * Inserts the key-value entry into the child at `pos` in `node`.
 *
 * @param node - To modify.
 * @param ord - Insertion order.
 * @param pos - Index of the modifying child in `node`.
 * @param key - To be inserted.
 * @param value - To be inserted.
 * @returns The modified `node`.
 */
const insertIntoChild = <K, V>(
    node: Internal<K, V>,
    ord: Ord<K>,
    pos: number,
    key: K,
    value: V,
): [Internal<K, V>, Option.Option<V>] => {
    const child = node.edges[pos]!;
    if (!isFull(child)) {
        const [newChild, removed] = insertNotFull(child, ord, key, value);
        return [
            {
                ...node,
                edges: node.edges.with(pos, newChild),
            },
            removed,
        ];
    }

    const [left, newNode, right] = splitChild(node, pos);
    switch (ord.cmp(key, newNode.keys[pos]!)) {
        case less: {
            const [newLeft, removed] = insertNotFull(left, ord, key, value);
            return [
                {
                    ...newNode,
                    edges: newNode.edges?.with(pos, newLeft) ?? null,
                },
                removed,
            ];
        }
        case equal:
            return [
                {
                    ...newNode,
                    values: newNode.values.with(pos, value),
                },
                Option.some(newNode.values[pos]!),
            ];
        case greater: {
            const [newRight, removed] = insertNotFull(right, ord, key, value);
            return [
                {
                    ...newNode,
                    edges: newNode.edges?.with(pos + 1, newRight) ?? null,
                },
                removed,
            ];
        }
    }
};

/**
 * Checks whether the tree is thin, that there is no entries to remove without breaking the invariant (4).
 *
 * @param tree - To check.
 * @returns Whether the tree is thin.
 */
export const isThin = <K, V>(node: Node<K, V>): boolean => node.keys.length < B;

/**
 * Finds the position index of entry by `key` in `node`.
 *
 * @param node - To find.
 * @param ord - Inserted order.
 * @param key - Querying.
 * @returns The position index of entry by `key` with `Ok` if it exists, otherwise the position index to insert with `Err`.
 */
export const findKeyIn = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
    key: K,
): Result.Result<number, number> => {
    let i = 0;
    for (; i < node.keys.length; ++i) {
        switch (ord.cmp(key, node.keys[i]!)) {
            case less:
                return Result.err(i);
            case equal:
                return Result.ok(i);
            case greater:
                break;
        }
    }
    return Result.err(i);
};

/**
 * Finds key and value at the maximum entry in the subtree rooted `node`.
 *
 * @param node - Not empty root of subtree to find.
 * @returns The maximum key-value.
 */
export const findMax = <K, V>(node: Node<K, V>): [K, V] => {
    if (isLeaf(node)) {
        return [node.keys.at(-1)!, node.values.at(-1)!];
    }
    return findMax(node.edges.at(-1)!);
};

/**
 * Finds key and value at the minimum entry in the subtree rooted `node`.
 *
 * @param node - Not empty root of subtree to find.
 * @returns the minimum key-value.
 */
export const findMin = <K, V>(node: Node<K, V>): [K, V] => {
    if (isLeaf(node)) {
        return [node.keys[0]!, node.values[0]!];
    }
    return findMin(node.edges[0]!);
};

/**
 * Removes the maximum entry from `node`.
 *
 * @param node - To modify.
 * @param ord - Insertion order for `K`.
 * @returns The modified one and removed maximum entry.
 */
export const popMax = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const maxEntry = findMax(node);
    return removeNotThin(node, maxEntry[0], ord);
};

/**
 * Removes the minimum entry from `node`.
 *
 * @param node - To modify.
 * @param ord - Insertion order for `K`.
 * @returns The modified one and removed minimum entry.
 */
export const popMin = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const minEntry = findMin(node);
    return removeNotThin(node, minEntry[0], ord);
};

/**
 * Removes the entry at `keyIndex` from the internal node `node` and returns the key and value.
 *
 * @param node - To modify.
 * @param keyIndex - Index of the entry to remove.
 * @param ord - Insertion order for `K`.
 * @returns The modified one and removed key-value entry.
 */
const removeInternalKey = <K, V>(
    node: Internal<K, V>,
    keyIndex: number,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const key = node.keys[keyIndex];
    const left = node.edges[keyIndex];
    const right = node.edges[keyIndex + 1];
    if (key == null || left == null || right == null) {
        throw new Error("`keyIndex` out of range");
    }

    if (!isThin(left)) {
        const [newLeft, leftMaxOpt] = popMax(left, ord);
        const leftMax = Option.unwrap(leftMaxOpt);
        const [replacedK, removedK] = replace(node.keys, keyIndex, leftMax[0]);
        const [replacedV, removedV] = replace(
            node.values,
            keyIndex,
            leftMax[1],
        );
        return [
            {
                keys: replacedK,
                values: replacedV,
                edges: node.edges.with(keyIndex, newLeft),
            },
            Option.some([removedK, removedV]),
        ];
    }

    if (!isThin(right)) {
        const [newRight, rightMinOpt] = popMin(right, ord);
        const rightMin = Option.unwrap(rightMinOpt);
        const [replacedK, removedK] = replace(node.keys, keyIndex, rightMin[0]);
        const [replacedV, removedV] = replace(
            node.values,
            keyIndex,
            rightMin[1],
        );
        return [
            {
                keys: replacedK,
                values: replacedV,
                edges: node.edges.with(keyIndex + 1, newRight),
            },
            Option.some([removedK, removedV]),
        ];
    }

    // `node` is expected to an internal node, so there must be children
    const merged = {
        keys: [...left.keys, node.keys[keyIndex]!, ...right.keys],
        values: [...left.values, node.values[keyIndex]!, ...right.values],
        edges:
            left.edges && right.edges ? [...left.edges, ...right.edges] : null,
    };
    const [newMerged, removed] = removeNotThin(merged, key, ord);
    return [
        {
            keys: node.keys.toSpliced(keyIndex, 1),
            values: node.values.toSpliced(keyIndex, 1),
            edges: node.edges.toSpliced(keyIndex, 2, newMerged),
        },
        removed,
    ];
};

/**
 * Removes the entry by `key` in the child node at `childIndex` in `node` after rotating entries to the right.
 *
 * @param node - To modify.
 * @param childIndex - Specifying the child node to remove.
 * @param key - Removal target.
 * @param ord - Insertion order ofr `K`.
 * @returns The modified one and removed key-value entry.
 */
const rotateRightRemove = <K, V>(
    node: Internal<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const child = node.edges[childIndex];
    if (!child) {
        throw new Error(
            "expected a child node at `childIndex - 1` and `childIndex`",
        );
    }
    const leftChild = node.edges[childIndex - 1]!;

    const borrowedK: K = leftChild.keys[leftChild.keys.length - 1]!;
    const borrowedV: V = leftChild.values[leftChild.values.length - 1]!;
    const borrowedE = leftChild.edges?.[leftChild.edges.length - 1] ?? null;
    const newLeftChild = {
        keys: leftChild.keys.slice(0, leftChild.keys.length - 1),
        values: leftChild.values.slice(0, leftChild.values.length - 1),
        edges: leftChild.edges?.slice(0, leftChild.edges.length - 1) ?? null,
    };

    const borrowedChild = {
        keys: [node.keys[childIndex - 1]!, ...child.keys],
        values: [node.values[childIndex - 1]!, ...child.values],
        edges: borrowedE && child.edges ? [borrowedE, ...child.edges] : null,
    };
    const [newChild, removed] = removeNotThin(borrowedChild, key, ord);
    return [
        {
            keys: node.keys.with(childIndex - 1, borrowedK),
            values: node.values.with(childIndex - 1, borrowedV),
            edges: node.edges.toSpliced(
                childIndex - 1,
                2,
                newLeftChild,
                newChild,
            ),
        },
        removed,
    ];
};

/**
 * Removes the entry by `key` in the child node at `childIndex` in `node` after rotating entries to the left.
 *
 * @param node - To modify.
 * @param childIndex - Specifying the child node to remove.
 * @param key - Removal target.
 * @param ord - Insertion order ofr `K`.
 * @returns The modified one and removed key-value entry.
 */
const rotateLeftRemove = <K, V>(
    node: Internal<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const rightChild = node.edges[childIndex + 1];
    if (!rightChild) {
        throw new Error(
            "expected a child note at `childIndex` and `childIndex + 1`",
        );
    }
    const child = node.edges[childIndex]!;

    const borrowedK: K = rightChild.keys[0]!;
    const borrowedV: V = rightChild.values[0]!;
    const borrowedE = rightChild.edges?.[0] ?? null;
    const newRightChild = {
        keys: rightChild.keys.slice(1),
        values: rightChild.values.slice(1),
        edges: rightChild.edges?.slice(1) ?? null,
    };

    const borrowedChild = {
        keys: [...child.keys, node.keys[childIndex]!],
        values: [...child.values, node.values[childIndex]!],
        edges: borrowedE && child.edges ? [...child.edges, borrowedE] : null,
    };
    const [newChild, removed] = removeNotThin(borrowedChild, key, ord);
    return [
        {
            keys: node.keys.with(childIndex, borrowedK),
            values: node.values.with(childIndex, borrowedV),
            edges: node.edges.toSpliced(childIndex, 2, newChild, newRightChild),
        },
        removed,
    ];
};

/**
 * Removes the entry by `key` in the child node at `leftChildIndex` in `node` after merging nodes at `leftChildIndex` and `leftChildIndex + 1`.
 *
 * @param node - To modify.
 * @param leftChildIndex - Specifying the left node to merge.
 * @param key - Removal target.
 * @param ord - Insertion order ofr `K`.
 * @returns The modified one and removed key-value entry.
 */
const mergeRemove = <K, V>(
    node: Internal<K, V>,
    leftChildIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const rightChild = node.edges[leftChildIndex + 1];
    if (!rightChild) {
        throw new Error(
            "expected a child note at `leftChildIndex` and `leftChildIndex + 1`",
        );
    }
    const leftChild = node.edges[leftChildIndex]!;

    const merged = {
        keys: [
            ...leftChild.keys,
            node.keys[leftChildIndex]!,
            ...rightChild.keys,
        ],
        values: [
            ...leftChild.values,
            node.values[leftChildIndex]!,
            ...rightChild.values,
        ],
        edges:
            leftChild.edges && rightChild.edges
                ? [...leftChild.edges, ...rightChild.edges]
                : null,
    };
    const [newChild, removed] = removeNotThin(merged, key, ord);
    return [
        {
            keys: node.keys.toSpliced(leftChildIndex, 1),
            values: node.values.toSpliced(leftChildIndex, 1),
            edges: node.edges.toSpliced(leftChildIndex, 2, newChild),
        },
        removed,
    ];
};

/**
 * Removes the entry by `key` in the child node at `childIndex` in `node`.
 *
 * @param node - To modify.
 * @param childIndex - Specifying the index to modify.
 * @param key - Removal target.
 * @param ord - Insertion order ofr `K`.
 * @returns The modified one and removed key-value entry.
 */
const removeInChild = <K, V>(
    node: Internal<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const child = node.edges[childIndex];
    if (!child) {
        throw new Error("`childIndex` out of range");
    }

    if (!isThin(child)) {
        const [newChild, removed] = removeNotThin(child, key, ord);
        return [
            { ...node, edges: node.edges.with(childIndex, newChild) },
            removed,
        ];
    }

    const hasLeftSibling = childIndex > 0;
    const hasRightSibling = childIndex < node.edges.length - 1;
    if (hasLeftSibling) {
        const leftChildTree = node.edges[childIndex - 1]!;
        if (!isThin(leftChildTree)) {
            return rotateRightRemove(node, childIndex, key, ord);
        }
        if (hasRightSibling) {
            const rightChildTree = node.edges[childIndex + 1]!;
            if (!isThin(rightChildTree)) {
                return rotateLeftRemove(node, childIndex, key, ord);
            }
        }
        return mergeRemove(node, childIndex - 1, key, ord);
    }
    if (hasRightSibling) {
        const rightChildTree = node.edges[childIndex + 1]!;
        if (!isThin(rightChildTree)) {
            return rotateLeftRemove(node, childIndex, key, ord);
        }
        return mergeRemove(node, childIndex, key, ord);
    }
    throw new Error("unreachable");
};

/**
 * Removes the entry by `key` from `node` which is not thin.
 *
 * @param node - To modify.
 * @param key - Removal target.
 * @param ord - Insertion order for `K`.
 * @returns The modified one and removed key-value entry.
 */
export const removeNotThin = <K, V>(
    node: Node<K, V>,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    // the reason why there are no checks is that this accepts a root node too.
    const posRes = findKeyIn(node, ord, key);
    if (isLeaf(node)) {
        if (Result.isErr(posRes)) {
            return [node, Option.none()];
        }
        const pos = Result.unwrap(posRes);
        return [
            {
                keys: node.keys.toSpliced(pos, 1),
                values: node.values.toSpliced(pos, 1),
                edges: null,
            },
            Option.some([node.keys[pos]!, node.values[pos]!]),
        ];
    }

    const pos = Result.mergeOkErr(posRes);
    if (Result.isErr(posRes)) {
        return removeInChild(node, pos, key, ord);
    }
    return removeInternalKey(node, pos, ord);
};

const stealLeft = <K, V>(
    amount: number,
    node: Internal<K, V>,
): Internal<K, V> => {
    const left = node.edges.at(-2)!;
    const leftLen = left.keys.length;
    const right = node.edges.at(-1)!;
    const rightLen = right.keys.length;

    if (!(rightLen + amount <= CAPACITY && leftLen >= amount)) {
        throw new Error("cannot steal safely");
    }

    const pivotK = node.keys.at(-1)!;
    const pivotV = node.values.at(-1)!;
    const newPivotK = left.keys[left.keys.length - amount]!;
    const newPivotV = left.values[left.values.length - amount]!;
    const newLeft = {
        keys: left.keys.slice(0, left.keys.length - amount),
        values: left.values.slice(0, left.values.length - amount),
        edges: left.edges?.slice(0, left.edges.length - amount) ?? null,
    };
    const newRight = {
        keys: [
            ...left.keys.slice(left.keys.length - amount + 1),
            pivotK,
            ...right.keys,
        ],
        values: [
            ...left.values.slice(left.values.length - amount + 1),
            pivotV,
            ...right.values,
        ],
        edges:
            left.edges && right.edges
                ? [
                      ...left.edges.slice(left.edges.length - amount),
                      ...right.edges,
                  ]
                : null,
    };
    return {
        keys: node.keys.with(-1, newPivotK),
        values: node.values.with(-1, newPivotV),
        edges: node.edges.toSpliced(-2, 2, newLeft, newRight),
    };
};

const fixRightBorderPlentiful = <K, V>(node: Node<K, V>): Node<K, V> => {
    if (isLeaf(node)) {
        return node;
    }

    if (isThin(node.edges.at(-1)!)) {
        const rightChildLen = node.edges.at(-1)!.keys.length;
        node = stealLeft(B - rightChildLen, node);
    }

    return {
        ...node,
        edges: node.edges.with(-1, fixRightBorderPlentiful(node.edges.at(-1)!)),
    };
};

/**
 * Builds a new `Tree` from sorted values quickly.
 *
 * @param values - Key-value pairs sorted in `K`'s order.
 * @returns The new tree.
 */
export const buildFromSorted = <K, V>(
    ord: Ord<K>,
    entries: readonly [K, V][],
): Node<K, V> => {
    if (entries.length === 0) {
        return empty();
    }

    // fill rightmost node in bottom-up
    const treeStack: Node<K, V>[] = [empty()];
    for (let i = 0; i < entries.length; ++i) {
        const [key, value] = entries[i]!;
        if (i < entries.length - 1 && ord.eq(key, entries[i + 1]![0])) {
            // skip duplicates
            continue;
        }

        const leaf = treeStack[0]!;
        if (!isFull(leaf)) {
            // fill leaf
            leaf.keys.push(key);
            leaf.values.push(value);
            continue;
        }

        // find or create a parent
        let level = 0;
        while (true) {
            const isReachedRoot = level + 1 >= treeStack.length;
            if (isReachedRoot) {
                treeStack.push({
                    keys: [],
                    values: [],
                    edges: [treeStack.at(-1)!],
                });
            }
            const parent = treeStack[level + 1]!;
            if (!isFull(parent)) {
                parent.keys.push(key);
                parent.values.push(value);
                break;
            }
            ++level;
        }

        // add new right children
        for (let j = level; j >= 0; --j) {
            const newNode =
                j === 0 ? empty<K, V>() : { keys: [], values: [], edges: [] };
            treeStack[j + 1]?.edges?.push(newNode);
            treeStack[j] = newNode;
        }
    }
    return fixRightBorderPlentiful(treeStack.at(-1)!);
};

/**
 * Creates a generator which merges two generators in ascending order. It's useful to implement union and symmetric difference of two sets.
 *
 * @param genA - Used to the left side of tuple.
 * @param genB - Used to the right side of tuple.
 * @param cmp - Function to compare two entries.
 * @returns The generator which merges `genA` and `genB`.
 */
export function* mergeIterator<I>(
    genA: Generator<I>,
    genB: Generator<I>,
    cmp: (lhs: I, rhs: I) => Ordering,
): Generator<[Option.Option<I>, Option.Option<I>]> {
    let peeked: [""] | ["a", I] | ["b", I] = [""];
    while (true) {
        let nextA: IteratorResult<I> =
            peeked[0] === "a" ? { value: peeked[1], done: false } : genA.next();
        let nextB: IteratorResult<I> =
            peeked[0] === "b" ? { value: peeked[1], done: false } : genB.next();
        peeked = [""];
        if (nextA.done && nextB.done) {
            return;
        }
        if (!nextA.done && !nextB.done) {
            switch (cmp(nextA.value, nextB.value)) {
                case less:
                    peeked = ["b", nextB.value];
                    nextB = { value: undefined, done: true };
                    break;
                case equal:
                    break;
                case greater:
                    peeked = ["a", nextA.value];
                    nextA = { value: undefined, done: true };
                    break;
            }
        }
        yield [
            nextA.done ? Option.none() : Option.some(nextA.value),
            nextB.done ? Option.none() : Option.some(nextB.value),
        ];
    }
}

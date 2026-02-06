/**
 * This module provides an implementation of B-tree with the parameter `B` to 6.
 *
 * ## Methods
 *
 * - ``
 *
 * ## Development note
 *
 * A B-tree (this custom) must maintain the following invariants:
 *
 * 1. Leaf nodes are at the same depth.
 * 2. Keys of each node are stored in the ascending order by `Ord` instance for `K`.
 * 3. Intermediate nodes have at least 6 children.
 * 4. Every nodes except root have at least 5 keys.
 * 5. Root node has no children or at least 2 children.
 * 6. A non-leaf node with `k` keys contains `k + 1` children.
 *
 * @packageDocumentation
 * @module
 */

import { Option, Result } from "../mod.js";
import { equal, greater, less } from "./ordering.js";
import type { Ord } from "./type-class/ord.js";

/** node split anchor */
const B = 6;
/** entries max */
const CAPACITY = (2 * B - 1) as 11;

interface Node<K, V> {
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
    edges: Tree<K, V>[];
}

type Tree<K, V> = Option.Option<Node<K, V>>;

//
// Core methods
//

/**
 * Creates a new empty `Tree<K, V>`.
 */
const empty: <K, V>() => Tree<K, V> = Option.none;
/**
 * Wraps a `Node<K, V>` into a `Tree<K, V>`.
 */
const branch: <K, V>(node: Node<K, V>) => Tree<K, V> = Option.some;

/**
 * Checks whether the node is a leaf, has no children.
 *
 * @param node - To be checked.
 * @returns Whether the node has no children.
 */
const isLeaf = <K, V>(node: Node<K, V>): boolean =>
    // it's ok to check only the first because leaf nodes are on the same level
    Option.isNone(node.edges[0]!);

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
const splitChild = <K, V>(
    parent: Node<K, V>,
    childIndex: number,
): [left: Node<K, V>, newParent: Node<K, V>, right: Node<K, V>] => {
    const childTree = parent.edges[childIndex];
    if (!childTree || Option.isNone(childTree)) {
        throw new Error("expected a child node at `childIndex`");
    }
    const child = Option.unwrap(childTree);
    if (!isFull(child)) {
        throw new Error("expected node with full entries");
    }

    const anchor = B - 1;
    const left = {
        keys: child.keys.slice(0, anchor),
        values: child.values.slice(0, anchor),
        edges: child.edges.slice(0, anchor + 1),
    };
    const centerKey = child.keys[anchor]!;
    const centerValue = child.values[anchor]!;
    const right = {
        keys: child.keys.slice(anchor + 1),
        values: child.values.slice(anchor + 1),
        edges: child.edges.slice(anchor + 1),
    };

    return [
        left,
        {
            keys: parent.keys.toSpliced(childIndex, 0, centerKey),
            values: parent.values.toSpliced(childIndex, 0, centerValue),
            edges: parent.edges.toSpliced(
                childIndex,
                1,
                branch(left),
                branch(right),
            ),
        },
        right,
    ];
};

/**
 * Checks whether the node is full of the capacity.
 */
const isFull = <K, V>(node: Node<K, V>): boolean =>
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
const insertNotFull = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
    key: K,
    value: V,
): [Node<K, V>, Option.Option<V>] => {
    if (!isFull(node)) {
        throw new Error("expected `node` is not full");
    }

    for (let i = 0; i < node.keys.length; ++i) {
        switch (ord.cmp(key, node.keys[i]!)) {
            case less: {
                if (Option.isNone(node.edges[i]!)) {
                    return [
                        {
                            keys: node.keys.toSpliced(i, 0, key),
                            values: node.values.toSpliced(i, 0, value),
                            edges: node.edges.toSpliced(0, 0, empty()),
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
    if (Option.isNone(node.edges.at(-1)!)) {
        return [
            {
                keys: node.keys.toSpliced(node.keys.length, 0, key),
                values: node.values.toSpliced(node.values.length, 0, value),
                edges: node.edges.toSpliced(0, 0, empty()),
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
    node: Node<K, V>,
    ord: Ord<K>,
    pos: number,
    key: K,
    value: V,
): [Node<K, V>, Option.Option<V>] => {
    const childTree = node.edges[pos];
    if (!childTree || Option.isNone(childTree)) {
        throw new Error("`pos` out of range");
    }

    const child = Option.unwrap(childTree);
    if (!isFull(child)) {
        const [newChild, removed] = insertNotFull(child, ord, key, value);
        return [
            {
                ...node,
                edges: node.edges.with(pos, branch(newChild)),
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
                    edges: newNode.edges.with(pos, branch(newLeft)),
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
                    edges: newNode.edges.with(pos + 1, branch(newRight)),
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
const isThin: <K, V>(tree: Tree<K, V>) => boolean = Option.mapOr(true)(
    (node) => node.keys.length < B,
);

/**
 * Finds the position index of entry by `key` in `node`.
 *
 * @param node - To find.
 * @param ord - Inserted order.
 * @param key - Querying.
 * @returns The position index of entry by `key` with `Ok` if it exists, otherwise the position index to insert with `Err`.
 */
const findKeyIn = <K, V>(
    node: Node<K, V>,
    ord: Ord<K>,
    key: K,
): Result.Result<number, number> => {
    for (let i = 0; i < node.keys.length; ++i) {
        switch (ord.cmp(key, node.keys[i]!)) {
            case less:
                return Result.err(i);
            case equal:
                return Result.ok(i);
            case greater:
                break;
        }
    }
    return Result.err(node.keys.length);
};

/**
 * Finds key and value at the maximum entry in the subtree rooted `node`.
 *
 * @param node - Root of subtree to find.
 * @returns The maximum key-value.
 */
const findMax = <K, V>(node: Node<K, V>): [K, V] => {
    if (Option.isNone(node.edges.at(-1)!)) {
        return [node.keys.at(-1)!, node.values.at(-1)!];
    }
    return findMax(Option.unwrap(node.edges.at(-1)!));
};

/**
 * Finds key and value at the minimum entry in the subtree rooted `node`.
 *
 * @param node - Root of subtree to find.
 * @returns the minimum key-value.
 */
const findMin = <K, V>(node: Node<K, V>): [K, V] => {
    if (Option.isNone(node.edges[0]!)) {
        return [node.keys[0]!, node.values[0]!];
    }
    return findMin(Option.unwrap(node.edges[0]!));
};

/**
 * Removes the maximum entry from `node`.
 *
 * @param node - To modify.
 * @param ord - Insertion order for `K`.
 * @returns The modified one and removed maximum entry.
 */
const popMax = <K, V>(
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
const popMin = <K, V>(
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
    node: Node<K, V>,
    keyIndex: number,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const key = node.keys[keyIndex];
    if (key == null) {
        throw new Error("`keyIndex` out of range");
    }

    const leftChild = node.edges[keyIndex]!;
    if (!isThin(leftChild)) {
        const left = Option.unwrap(leftChild);
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
                edges: node.edges.with(keyIndex, branch(newLeft)),
            },
            Option.some([removedK, removedV]),
        ];
    }

    const rightChild = node.edges[keyIndex + 1]!;
    if (!isThin(rightChild)) {
        const right = Option.unwrap(rightChild);
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
                edges: node.edges.with(keyIndex, branch(newRight)),
            },
            Option.some([removedK, removedV]),
        ];
    }

    // `node` is expected to an internal node, so there must be children
    const left = Option.unwrap(leftChild);
    const right = Option.unwrap(rightChild);
    const merged = {
        keys: [...left.keys, node.keys[keyIndex]!, ...right.keys],
        values: [...left.values, node.values[keyIndex]!, ...right.values],
        edges: [...left.edges, ...right.edges],
    };
    return removeNotThin(merged, key, ord);
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
    node: Node<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const childTree = node.edges[childIndex];
    if (!childTree || Option.isNone(childTree)) {
        throw new Error(
            "expected a child node at `childIndex - 1` and `childIndex`",
        );
    }
    const child = Option.unwrap(childTree);
    const leftChild = Option.unwrap(node.edges[childIndex - 1]!);

    const borrowedK: K = leftChild.keys[leftChild.keys.length - 1]!;
    const borrowedV: V = leftChild.values[leftChild.values.length - 1]!;
    const borrowedE = leftChild.edges[leftChild.edges.length - 1]!;
    const newLeftChild = {
        keys: leftChild.keys.slice(0, leftChild.keys.length - 1),
        values: leftChild.values.slice(0, leftChild.values.length - 1),
        edges: leftChild.edges.slice(0, leftChild.edges.length - 1),
    };

    const borrowedChild = {
        keys: [borrowedK, ...child.keys],
        values: [borrowedV, ...child.values],
        edges: [borrowedE, ...child.edges],
    };
    const [newChild, removed] = removeNotThin(borrowedChild, key, ord);
    return [
        {
            ...node,
            edges: node.edges.toSpliced(
                childIndex - 1,
                2,
                branch(newLeftChild),
                branch(newChild),
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
    node: Node<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const rightChildTree = node.edges[childIndex + 1];
    if (!rightChildTree || Option.isNone(rightChildTree)) {
        throw new Error(
            "expected a child note at `childIndex` and `childIndex + 1`",
        );
    }
    const rightChild = Option.unwrap(rightChildTree);
    const child = Option.unwrap(node.edges[childIndex]!);

    const borrowedK: K = rightChild.keys[0]!;
    const borrowedV: V = rightChild.values[0]!;
    const borrowedE = rightChild.edges[0]!;
    const newRightChild = {
        keys: rightChild.keys.slice(1),
        values: rightChild.values.slice(1),
        edges: rightChild.edges.slice(1),
    };

    const borrowedChild = {
        keys: [...child.keys, borrowedK],
        values: [...child.values, borrowedV],
        edges: [...child.edges, borrowedE],
    };
    const [newChild, removed] = removeNotThin(borrowedChild, key, ord);
    return [
        {
            ...node,
            edges: node.edges.toSpliced(
                childIndex,
                2,
                branch(newChild),
                branch(newRightChild),
            ),
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
    node: Node<K, V>,
    leftChildIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const rightChildTree = node.edges[leftChildIndex + 1];
    if (!rightChildTree || Option.isNone(rightChildTree)) {
        throw new Error(
            "expected a child note at `leftChildIndex` and `leftChildIndex + 1`",
        );
    }
    const rightChild = Option.unwrap(rightChildTree);
    const leftChild = Option.unwrap(node.edges[leftChildIndex]!);

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
        edges: [...leftChild.edges, ...rightChild.edges],
    };
    const [newChild, removed] = removeNotThin(merged, key, ord);
    return [
        {
            keys: node.keys.toSpliced(leftChildIndex, 1),
            values: node.values.toSpliced(leftChildIndex, 1),
            edges: node.edges.toSpliced(leftChildIndex, 2, branch(newChild)),
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
    node: Node<K, V>,
    childIndex: number,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
    const childTree = node.edges[childIndex];
    if (!childTree) {
        throw new Error("`childIndex` out of range");
    }

    if (!isThin(childTree)) {
        const [newChild, removed] = removeNotThin(
            Option.unwrap(childTree),
            key,
            ord,
        );
        return [
            { ...node, edges: node.edges.with(childIndex, branch(newChild)) },
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
const removeNotThin = <K, V>(
    node: Node<K, V>,
    key: K,
    ord: Ord<K>,
): [Node<K, V>, Option.Option<[K, V]>] => {
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
                edges: node.edges.toSpliced(pos, 1),
            },
            Option.some([node.keys[pos]!, node.values[pos]!]),
        ];
    }

    if (Result.isErr(posRes)) {
        return removeInChild(node, node.edges.length - 1, key, ord);
    }
    const pos = Result.unwrap(posRes);
    return removeInternalKey(node, pos, ord);
};

//
// BTreeMap methods
//

/**
 * Stores the values `V` associated to the keys `K` which is expected to implement `Ord` type class.
 */
export type BTreeMap<K, V> = Tree<K, V>;

/**
 * Creates a new `BTreeMap<K, V>`.
 *
 * @returns The new empty collection.
 */
export const newMap: <K, V>() => BTreeMap<K, V> = empty;

/**
 * Inserts `item` to `map`. It takes `O(log N)`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Specifying the entry.
 * @param value - To be inserted.
 * @param map - Insertion target.
 * @returns Tuple of inserted set and replaced old value if `key` was a duplicated entry.
 */
export const insert =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(value: V) =>
    (map: BTreeMap<K, V>): [tree: BTreeMap<K, V>, old: Option.Option<V>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }

        const node = Option.unwrap(map);
        if (!isFull(node)) {
            const [newNode, old] = insertNotFull(node, ord, key, value);
            return [branch(newNode), old];
        }

        const [left, newNode, right] = splitChild(node, 0);
        switch (ord.cmp(key, newNode.keys[0]!)) {
            case less: {
                const [newLeft, old] = insertNotFull(left, ord, key, value);
                return [
                    branch({
                        ...newNode,
                        edges: newNode.edges.with(0, branch(newLeft)),
                    }),
                    old,
                ];
            }
            case equal: {
                return [
                    branch({
                        ...newNode,
                        values: newNode.values.with(0, value),
                    }),
                    Option.some(newNode.values[0]!),
                ];
            }
            case greater: {
                const [newRight, old] = insertNotFull(right, ord, key, value);
                return [
                    branch({
                        ...newNode,
                        edges: newNode.edges.with(1, branch(newRight)),
                    }),
                    old,
                ];
            }
        }
    };

/**
 * Removes the entry keyed by `key` and returns the removed item if it exists.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Specifying the entry.
 * @param map - Removal target.
 * @returns The removed one if it exists.
 */
export const remove =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(map: BTreeMap<K, V>): [BTreeMap<K, V>, Option.Option<V>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }

        const [newMap, opt] = removeNotThin(Option.unwrap(map), key, ord);
        return [branch(newMap), Option.map(([, value]: [K, V]) => value)(opt)];
    };

/**
 * Gets the item associated to `key` in `map`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Querying the entry.
 * @param map - Query target.
 * @returns The found item if it exists.
 */
export const get =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(map: BTreeMap<K, V>): Option.Option<V> => {
        while (true) {
            if (Option.isNone(map)) {
                return Option.none();
            }

            const node = Option.unwrap(map);
            const posRes = findKeyIn(node, ord, key);
            if (isLeaf(node)) {
                return Option.map((index: number) => node.values[index]!)(
                    Result.optionOk(posRes),
                );
            }

            const index = Result.mergeOkErr(posRes);
            if (Result.isOk(posRes)) {
                return Option.some(node.values[index]!);
            }
            map = node.edges[index]!;
        }
    };

/**
 * Counts the inserted items of `map`.
 *
 * @param map - To count.
 * @returns The size of the tree.
 */
export const len: <K, V>(map: BTreeMap<K, V>) => number = Option.mapOr(0)(
    (node) =>
        node.keys.length +
        node.edges.reduce((prev, edge) => prev + len(edge), 0),
);

//
// BTreeSet methods
//

/**
 * Stores the unique values `T` which is expected to implement `Ord` type class.
 */
export type BTreeSet<T> = Tree<T, never[]>;

/**
 * Creates a new `BTreeSet<T>`.
 *
 * @returns The new empty collection.
 */
export const newSet: <T>() => BTreeSet<T> = empty;

/**
 * Converts the set into an iterator traversing contained items.
 *
 * @param set - To be traversed.
 * @returns The iterator of contained items.
 */
export function* setToIterator<T>(set: BTreeSet<T>): Iterator<T> {
    if (Option.isNone(set)) {
        return;
    }
    function* nodeToIterator(node: Node<T, never[]>): Iterable<T> {
        for (let i = 0; i < node.keys.length; ++i) {
            const next = node.edges[i]!;
            if (Option.isNone(next)) {
                return;
            }
            yield* nodeToIterator(Option.unwrap(next));
            yield node.keys[i]!;
        }
        const next = node.edges[node.keys.length]!;
        if (Option.isNone(next)) {
            return;
        }
        yield* nodeToIterator(Option.unwrap(next));
    }
    yield* nodeToIterator(Option.unwrap(set));
}

/**
 * Checks whether the `needle` is contained in the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param needle - Item to check.
 * @returns Whether the `set` has `needle`.
 */
export const has =
    <T>(ord: Ord<T>) =>
    (needle: T) =>
    (set: BTreeSet<T>): boolean =>
        Option.isSome(get(ord)(needle)(set));

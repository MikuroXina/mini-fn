/**
 * This module provides a simple binary heap.
 *
 * @module
 * @packageDocumentation
 */

import { none, type Option, some } from "./option.ts";
import { isLe } from "./ordering.ts";
import { type Ord, reversed } from "./type-class/ord.ts";

/**
 * A min-heap with the order of `T`.
 */
export type BinaryHeap<T> = Readonly<{
    /**
     * Items stored as a thread tree.
     */
    items: readonly T[];
    /**
     * Order of the type `T`.
     */
    order: Ord<T>;
}>;

/**
 * Creates a new empty min-heap.
 *
 * @param order - A total order for `T`.
 * @returns The new empty heap.
 */
export const empty = <T>(order: Ord<T>): BinaryHeap<T> => ({
    order,
    items: [],
});

/**
 * Creates a new max-heap. It is equivalent to `minHeap(reversed(order))(data)`.
 *
 * @param order - A total order for `T`.
 * @param data - Data to store.
 * @returns The new max-heap.
 */
export const maxHeap =
    <T>(order: Ord<T>) => (data: readonly T[]): BinaryHeap<T> =>
        minHeap(reversed(order))(data);

/**
 * Creates a new min-heap. It uses `Array.prototype.sort` to make `data` into a heap.
 *
 * @param order - A total order for `T`.
 * @param data - Data to store.
 * @returns The new min-heap.
 */
export const minHeap =
    <T>(order: Ord<T>) => (data: readonly T[]): BinaryHeap<T> => ({
        items: data.toSorted((a, b) => order.cmp(a, b)),
        order,
    });

/**
 * Checks whether the heap has no elements.
 *
 * @param heap - A heap to be checked.
 * @returns `true` if only has no elements, otherwise `false`.
 */
export const isEmpty = <T>(heap: BinaryHeap<T>): boolean =>
    heap.items.length === 0;

/**
 * Gets the length of the heap.
 *
 * @param heap - A heap to be queried.
 * @returns The length of heap.
 */
export const length = <T>(heap: BinaryHeap<T>): number => heap.items.length;

/**
 * Gets the minimum element in the heap quickly. It takes `O(1)`.
 *
 * @param heap - A heap to be queried.
 * @returns The minimum element.
 */
export const getMin = <T>(heap: BinaryHeap<T>): Option<T> =>
    isEmpty(heap) ? none() : some(heap.items[0]);

/**
 * Extracts the internal items from the heap.
 *
 * @param heap - A heap to be extracted.
 * @returns The internal items array that consists the heap.
 */
export const intoItems = <T>(heap: BinaryHeap<T>): readonly T[] => heap.items;

const parentOf = (index: number) => Math.floor((index - 1) / 2);
const leftChildOf = (index: number) => 2 * index + 1;
const rightChildOf = (index: number) => 2 * index + 2;

const upHeap =
    (target: number) => <T>(order: Ord<T>) => (items: T[]): BinaryHeap<T> => {
        while (true) {
            const parent = parentOf(target);
            if (
                parent < 0 ||
                isLe(order.cmp(items[parent], items[target]))
            ) {
                return { order, items };
            }
            const temp = items[parent];
            items[parent] = items[target];
            items[target] = temp;
            target = parent;
        }
    };
const downHeap =
    (target: number) => <T>(order: Ord<T>) => (items: T[]): BinaryHeap<T> => {
        while (true) {
            const leftChild = leftChildOf(target);
            const rightChild = rightChildOf(target);
            if (
                leftChild >= items.length || rightChild >= items.length ||
                (isLe(order.cmp(items[target], items[leftChild])) &&
                    isLe(order.cmp(items[target], items[rightChild])))
            ) {
                return { order, items };
            }
            const swapTo = isLe(order.cmp(items[leftChild], items[rightChild]))
                ? leftChild
                : rightChild;
            const temp = items[swapTo];
            items[swapTo] = items[target];
            items[target] = temp;
            target = swapTo;
        }
    };

/**
 * Inserts the new item to the heap. It takes `O(log n)` to insert, but also takes `O(n)` to copy the items.
 *
 * @param item - To insert.
 * @param heap - To be inserted.
 * @returns The inserted new heap.
 */
export const insert = <T>(item: T) => (heap: BinaryHeap<T>): BinaryHeap<T> =>
    upHeap(heap.items.length)(heap.order)([...heap.items, item]);

/**
 * Removes the minimum item from the heap. It takes `O(log n)`, but also takes `O(n)` to copy the items.
 *
 * @param heap - To be modified.
 * @returns The popped new heap.
 */
export const popMin = <T>(heap: BinaryHeap<T>): BinaryHeap<T> => {
    if (isEmpty(heap)) return heap;
    const items = [...heap.items];
    items[0] = items[items.length - 1];
    items.pop();
    return downHeap(0)(heap.order)(items);
};

/**
 * Pops the minimum item then adds a new item. It is efficient than calling `popMin` and `insert` manually.
 *
 * @param item - To insert.
 * @param heap - To be modified.
 * @returns The modified new heap.
 */
export const popMinAndInsert =
    <T>(item: T) => (heap: BinaryHeap<T>): BinaryHeap<T> => {
        if (isEmpty(heap)) {
            return insert(item)(heap);
        }
        const items = [...heap.items];
        const oldValue = items[0];
        items[0] = item;
        if (isLe(heap.order.cmp(oldValue, item))) {
            return downHeap(0)(heap.order)(items);
        }
        return { ...heap, items };
    };

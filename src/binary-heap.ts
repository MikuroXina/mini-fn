/**
 * This module provides a simple binary heap.
 *
 * @module
 * @packageDocumentation
 */

import { doT } from "./cat.ts";
import {
    mapMut,
    modifyMutRef,
    monad as mutMonad,
    type Mut,
    type MutRef,
    newMutRef,
    pureMut,
    readMutRef,
} from "./mut.ts";
import { none, type Option, some } from "./option.ts";
import { isLe } from "./ordering.ts";
import { type Ord, reversed } from "./type-class/ord.ts";

export type BinaryHeapInner<T> = {
    /**
     * Items stored as a thread tree.
     */
    items: T[];
    /**
     * Order of the type `T`.
     */
    order: Ord<T>;
};

/**
 * A min-heap with the order of `T`.
 */
export type BinaryHeap<T> = BinaryHeapInner<T>;

/**
 * Creates a new empty min-heap.
 *
 * @param order - A total order for `T`.
 * @returns The new empty heap.
 */
export const empty = <S, T>(order: Ord<T>): Mut<S, MutRef<S, BinaryHeap<T>>> =>
    newMutRef({
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
    <T>(order: Ord<T>) =>
    <S>(data: readonly T[]): Mut<S, MutRef<S, BinaryHeap<T>>> =>
        minHeap(reversed(order))(data);

/**
 * Creates a new min-heap. It uses `Array.prototype.sort` to make `data` into a heap.
 *
 * @param order - A total order for `T`.
 * @param data - Data to store.
 * @returns The new min-heap.
 */
export const minHeap =
    <T>(order: Ord<T>) =>
    <S>(data: readonly T[]): Mut<S, MutRef<S, BinaryHeap<T>>> =>
        newMutRef({
            items: data.toSorted((a, b) => order.cmp(a, b)),
            order,
        });

/**
 * Checks whether the heap has no elements.
 *
 * @param heap - A heap to be checked.
 * @returns `true` if only has no elements, otherwise `false`.
 */
export const isEmpty = <S, T>(
    heap: MutRef<S, BinaryHeap<T>>,
): Mut<S, boolean> =>
    mapMut((heap: BinaryHeapInner<T>) => heap.items.length === 0)(
        readMutRef(heap),
    );

/**
 * Gets the length of the heap.
 *
 * @param heap - A heap to be queried.
 * @returns The length of heap.
 */
export const length = <S, T>(heap: MutRef<S, BinaryHeap<T>>): Mut<S, number> =>
    mapMut((heap: BinaryHeapInner<T>) => heap.items.length)(readMutRef(heap));

/**
 * Gets the minimum element in the heap quickly. It takes `O(1)`.
 *
 * @param heap - A heap to be queried.
 * @returns The minimum element.
 */
export const getMin = <S, T>(
    heap: MutRef<S, BinaryHeap<T>>,
): Mut<S, Option<T>> =>
    mapMut((heap: BinaryHeapInner<T>) =>
        0 in heap.items ? some(heap.items[0]) : none()
    )(readMutRef(heap));

/**
 * Extracts the internal items from the heap.
 *
 * @param heap - A heap to be extracted.
 * @returns The internal items array that consists the heap.
 */
export const intoItems = <T>(heap: BinaryHeapInner<T>): readonly T[] =>
    heap.items;

const parentOf = (index: number): number => Math.floor((index - 1) / 2);
const leftChildOf = (index: number) => 2 * index + 1;
const rightChildOf = (index: number) => 2 * index + 2;

const upHeap = (target: number) => <T>(order: Ord<T>) => (items: T[]): void => {
    while (true) {
        const parent = parentOf(target);
        if (
            parent < 0 ||
            isLe(order.cmp(items[parent], items[target]))
        ) {
            return;
        }
        const temp = items[parent];
        items[parent] = items[target];
        items[target] = temp;
        target = parent;
    }
};
const downHeap =
    (target: number) => <T>(order: Ord<T>) => (items: T[]): void => {
        while (true) {
            const leftChild = leftChildOf(target);
            const rightChild = rightChildOf(target);
            if (
                leftChild >= items.length || rightChild >= items.length ||
                (isLe(order.cmp(items[target], items[leftChild])) &&
                    isLe(order.cmp(items[target], items[rightChild])))
            ) {
                return;
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
export const insert =
    <T>(item: T) => <S>(heap: MutRef<S, BinaryHeap<T>>): Mut<S, never[]> =>
        modifyMutRef(heap)((heap) => {
            heap.items.push(item);
            upHeap(heap.items.length - 1)(heap.order)(heap.items);
            return heap;
        });

/**
 * Removes the minimum item from the heap. It takes `O(log n)`, but also takes `O(n)` to copy the items.
 *
 * @param heap - To be modified.
 * @returns The removed item, or none if empty.
 */
export const popMin = <S, T>(
    heap: MutRef<S, BinaryHeap<T>>,
): Mut<S, Option<T>> =>
    doT(mutMonad<S>())
        .addM("heap", readMutRef(heap))
        .addM("wasEmpty", isEmpty(heap))
        .finish(({ heap, wasEmpty }) => {
            if (wasEmpty) {
                return none();
            }
            const popped = heap.items[0];
            heap.items[0] = heap.items[heap.items.length - 1];
            heap.items.pop();
            downHeap(0)(heap.order)(heap.items);
            return some(popped);
        });

/**
 * Pops the minimum item then adds a new item. It is efficient than calling `popMin` and `insert` manually.
 *
 * @param item - To insert.
 * @param heap - To be modified.
 * @returns The removed item, or none if empty.
 */
export const popMinAndInsert =
    <T>(item: T) => <S>(heap: MutRef<S, BinaryHeap<T>>): Mut<S, Option<T>> =>
        doT(mutMonad<S>())
            .addM("inner", readMutRef(heap))
            .addM("wasEmpty", isEmpty(heap))
            .finishM(({ inner, wasEmpty }) => {
                if (wasEmpty) {
                    return doT(mutMonad<S>())
                        .run(insert(item)(heap))
                        .finish(() => none() as Option<T>);
                }
                const oldValue = inner.items[0];
                inner.items[0] = item;
                if (isLe(inner.order.cmp(oldValue, item))) {
                    downHeap(0)(inner.order)(inner.items);
                }
                return pureMut(some(oldValue));
            });

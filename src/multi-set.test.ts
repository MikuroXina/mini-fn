import { expect, test } from "vitest";
import {
    contains,
    count,
    empty,
    insert,
    intoMut,
    len,
    remove,
} from "./multi-set.js";
import { doMut, readMutRef } from "./mut.js";

test("len", () => {
    expect(len(empty())).toStrictEqual(0);

    const one = doMut((cat) =>
        cat
            .addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set)),
    );
    expect(len(one)).toStrictEqual(1);
});

test("contains", () => {
    expect(contains(0)(empty())).toStrictEqual(false);
    expect(contains(1)(empty())).toStrictEqual(false);

    const one = doMut((cat) =>
        cat
            .addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set)),
    );
    expect(contains(0)(one)).toStrictEqual(false);
    expect(contains(1)(one)).toStrictEqual(true);
    expect(contains(2)(one)).toStrictEqual(false);
});

test("count", () => {
    expect(count(0)(empty())).toStrictEqual(0);
    expect(count(1)(empty())).toStrictEqual(0);

    const one = doMut((cat) =>
        cat
            .addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set)),
    );
    expect(count(0)(one)).toStrictEqual(0);
    expect(count(1)(one)).toStrictEqual(1);
    expect(count(2)(one)).toStrictEqual(0);

    const oneTwoTwo = doMut((cat) =>
        cat
            .addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .runWith(({ set }) => insert(2)(set))
            .runWith(({ set }) => insert(2)(set))
            .addMWith("_", ({ set }) => remove(2)(set))
            .runWith(({ set }) => insert(2)(set))
            .finishM(({ set }) => readMutRef(set)),
    );
    expect(count(0)(oneTwoTwo)).toStrictEqual(0);
    expect(count(1)(oneTwoTwo)).toStrictEqual(1);
    expect(count(2)(oneTwoTwo)).toStrictEqual(2);
    expect(count(3)(oneTwoTwo)).toStrictEqual(0);
});

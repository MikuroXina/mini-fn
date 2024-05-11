import { assertEquals } from "../deps.ts";
import {
    contains,
    count,
    empty,
    insert,
    intoMut,
    len,
    remove,
} from "./multi-set.ts";
import { doMut, readMutRef } from "./mut.ts";

Deno.test("len", () => {
    assertEquals(len(empty()), 0);

    const one = doMut((cat) =>
        cat.addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set))
    );
    assertEquals(len(one), 1);
});

Deno.test("contains", () => {
    assertEquals(contains(0)(empty()), false);
    assertEquals(contains(1)(empty()), false);

    const one = doMut((cat) =>
        cat.addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set))
    );
    assertEquals(contains(0)(one), false);
    assertEquals(contains(1)(one), true);
    assertEquals(contains(2)(one), false);
});

Deno.test("count", () => {
    assertEquals(count(0)(empty()), 0);
    assertEquals(count(1)(empty()), 0);

    const one = doMut((cat) =>
        cat.addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .finishM(({ set }) => readMutRef(set))
    );
    assertEquals(count(0)(one), 0);
    assertEquals(count(1)(one), 1);
    assertEquals(count(2)(one), 0);

    const oneTwoTwo = doMut((cat) =>
        cat.addM("set", intoMut(empty<number>()))
            .runWith(({ set }) => insert(1)(set))
            .runWith(({ set }) => insert(2)(set))
            .runWith(({ set }) => insert(2)(set))
            .addMWith("_", ({ set }) => remove(2)(set))
            .runWith(({ set }) => insert(2)(set))
            .finishM(({ set }) => readMutRef(set))
    );
    assertEquals(count(0)(oneTwoTwo), 0);
    assertEquals(count(1)(oneTwoTwo), 1);
    assertEquals(count(2)(oneTwoTwo), 2);
    assertEquals(count(3)(oneTwoTwo), 0);
});

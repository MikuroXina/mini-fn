import { assertEquals } from "../../deps.ts";
import { empty, fromArray, isDeep, isEmpty, isSingle } from "./finger-tree.ts";

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

import { range } from "./list.ts";
import { none, some, unwrap } from "./option.ts";
import { end, fromList, left, right, start, top } from "./zipper.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("seeking", () => {
    const zipper = unwrap(fromList(range(0, 8)));
    assertEquals(zipper.current, 0);
    assertEquals(top(zipper), [none(), 0, some(1)]);

    const next = unwrap(right(zipper));
    assertEquals(top(next), [some(0), 1, some(2)]);
    const back = unwrap(left(next));
    assertEquals(top(back), [none(), 0, some(1)]);

    const endOfList = end(back);
    assertEquals(top(endOfList), [some(6), 7, none()]);
    const startOfList = start(endOfList);
    assertEquals(top(startOfList), [none(), 0, some(1)]);
});

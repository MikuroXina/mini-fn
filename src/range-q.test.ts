import { assertEquals } from "../deps.ts";
import { empty, range } from "./list.ts";
import { fromList, sum, sumFromStartTo } from "./range-q.ts";
import { addGroup } from "./type-class/group.ts";

Deno.test("empty", () => {
    const rangeQ = fromList(addGroup)(empty());

    assertEquals(sumFromStartTo(-1)(rangeQ), 0);
    assertEquals(sumFromStartTo(0)(rangeQ), 0);
    assertEquals(sumFromStartTo(1)(rangeQ), 0);
    assertEquals(sumFromStartTo(2)(rangeQ), 0);
});

Deno.test("sum range", () => {
    const rangeQ = fromList(addGroup)(range(0, 6));

    assertEquals(sumFromStartTo(0)(rangeQ), 0);
    assertEquals(sumFromStartTo(1)(rangeQ), 0);
    assertEquals(sumFromStartTo(2)(rangeQ), 1);
    assertEquals(sumFromStartTo(3)(rangeQ), 3);
    assertEquals(sumFromStartTo(4)(rangeQ), 6);
    assertEquals(sumFromStartTo(5)(rangeQ), 10);
    assertEquals(sumFromStartTo(6)(rangeQ), 15);
    assertEquals(sumFromStartTo(7)(rangeQ), 15);

    for (let i = 0; i < 6; ++i) {
        for (let j = 0; j < 6; ++j) {
            let expected = 0;
            for (let x = i; x < j; ++x) {
                expected += x;
            }
            assertEquals(sum(i)(j)(rangeQ), expected);
        }
    }
});

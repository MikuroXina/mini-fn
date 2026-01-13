import { expect, test } from "vitest";
import { empty, range } from "./list.js";
import { fromList, sum, sumFromStartTo } from "./range-q.js";
import { addGroup } from "./type-class/group.js";

test("empty", () => {
    const rangeQ = fromList(addGroup)(empty());

    expect(sumFromStartTo(-1)(rangeQ)).toStrictEqual(0);
    expect(sumFromStartTo(0)(rangeQ)).toStrictEqual(0);
    expect(sumFromStartTo(1)(rangeQ)).toStrictEqual(0);
    expect(sumFromStartTo(2)(rangeQ)).toStrictEqual(0);
});

test("sum range", () => {
    const rangeQ = fromList(addGroup)(range(0, 6));

    expect(sumFromStartTo(0)(rangeQ)).toStrictEqual(0);
    expect(sumFromStartTo(1)(rangeQ)).toStrictEqual(0);
    expect(sumFromStartTo(2)(rangeQ)).toStrictEqual(1);
    expect(sumFromStartTo(3)(rangeQ)).toStrictEqual(3);
    expect(sumFromStartTo(4)(rangeQ)).toStrictEqual(6);
    expect(sumFromStartTo(5)(rangeQ)).toStrictEqual(10);
    expect(sumFromStartTo(6)(rangeQ)).toStrictEqual(15);
    expect(sumFromStartTo(7)(rangeQ)).toStrictEqual(15);

    for (let i = 0; i < 6; ++i) {
        for (let j = 0; j < 6; ++j) {
            let expected = 0;
            for (let x = i; x < j; ++x) {
                expected += x;
            }
            expect(sum(i)(j)(rangeQ)).toStrictEqual(expected);
        }
    }
});

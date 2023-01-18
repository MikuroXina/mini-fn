import { end, fromList, left, right, start, top } from "./zipper.js";
import { expect, test } from "vitest";
import { none, some, unwrap } from "./option.js";

import { range } from "./list.js";

test("seeking", () => {
    const zipper = unwrap(fromList(range(0, 8)));
    expect(zipper.current).toEqual(0);
    expect(top(zipper)).toEqual([none(), 0, some(1)]);

    const next = unwrap(right(zipper));
    expect(top(next)).toEqual([some(0), 1, some(2)]);
    const back = unwrap(left(next));
    expect(top(back)).toEqual([none(), 0, some(1)]);

    const endOfList = end(back);
    expect(top(endOfList)).toEqual([some(6), 7, none()]);
    const startOfList = start(endOfList);
    expect(top(startOfList)).toEqual([none(), 0, some(1)]);
});

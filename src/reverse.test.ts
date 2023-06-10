import { expect, test } from "vitest";

import { partialOrd as numberPartialOrd } from "./number.js";
import { some } from "./option.js";
import { equal, greater, less } from "./ordering.js";
import { partialOrd, pure } from "./reverse.js";

test("order", () => {
    const order = partialOrd(numberPartialOrd);
    expect(order.eq(pure(2), pure(2))).toBe(true);
    expect(order.eq(pure(1), pure(2))).toBe(false);
    expect(order.partialCmp(pure(1), pure(2))).toEqual(some(greater));
    expect(order.partialCmp(pure(2), pure(1))).toEqual(some(less));
    expect(order.partialCmp(pure(2), pure(2))).toEqual(some(equal));
});

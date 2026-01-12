import { expect, test } from "vitest";
import * as Number from "./number.js";
import { some } from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { partialOrd, pure } from "./reverse.js";

test("order", () => {
    const order = partialOrd(Number.partialOrd);
    expect(order.eq(pure(2), pure(2))).toStrictEqual(true);
    expect(order.eq(pure(1), pure(2))).toStrictEqual(false);
    expect(order.partialCmp(pure(1), pure(2))).toStrictEqual(
        some(greater as Ordering),
    );
    expect(order.partialCmp(pure(2), pure(1))).toStrictEqual(
        some(less as Ordering),
    );
    expect(order.partialCmp(pure(2), pure(2))).toStrictEqual(
        some(equal as Ordering),
    );
});

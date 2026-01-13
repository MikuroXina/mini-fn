import { expect, test } from "vitest";
import { partialCmp } from "./number.js";
import { none, some } from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";

test("partialCmp", () => {
    expect(partialCmp(1, NaN)).toStrictEqual(none());
    expect(partialCmp(NaN, 2)).toStrictEqual(none());
    expect(partialCmp(NaN, NaN)).toStrictEqual(none());
    expect(partialCmp(1, 1)).toStrictEqual(some(equal as Ordering));
    expect(partialCmp(2, 2)).toStrictEqual(some(equal as Ordering));
    expect(partialCmp(1, 2)).toStrictEqual(some(less as Ordering));
    expect(partialCmp(2, 1)).toStrictEqual(some(greater as Ordering));
});

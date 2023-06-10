import { expect, test } from "vitest";

import { partialCmp } from "./number.js";
import { none, some } from "./option.js";
import { equal, greater, less } from "./ordering.js";

test("partialCmp", () => {
    expect(partialCmp(1, NaN)).toEqual(none());
    expect(partialCmp(NaN, 2)).toEqual(none());
    expect(partialCmp(NaN, NaN)).toEqual(none());
    expect(partialCmp(1, 1)).toEqual(some(equal));
    expect(partialCmp(2, 2)).toEqual(some(equal));
    expect(partialCmp(1, 2)).toEqual(some(less));
    expect(partialCmp(2, 1)).toEqual(some(greater));
});

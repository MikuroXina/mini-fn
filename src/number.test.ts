import { assertEquals } from "../deps.ts";
import { partialCmp } from "./number.ts";
import { none, some } from "./option.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";

Deno.test("partialCmp", () => {
    assertEquals(partialCmp(1, NaN), none());
    assertEquals(partialCmp(NaN, 2), none());
    assertEquals(partialCmp(NaN, NaN), none());
    assertEquals(partialCmp(1, 1), some(equal as Ordering));
    assertEquals(partialCmp(2, 2), some(equal as Ordering));
    assertEquals(partialCmp(1, 2), some(less as Ordering));
    assertEquals(partialCmp(2, 1), some(greater as Ordering));
});

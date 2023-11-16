import { assertEquals } from "../deps.ts";
import * as Number from "./number.ts";
import { some } from "./option.ts";
import { equal, greater, less, Ordering } from "./ordering.ts";
import { partialOrd, pure } from "./reverse.ts";

Deno.test("order", () => {
    const order = partialOrd(Number.partialOrd);
    assertEquals(order.eq(pure(2), pure(2)), true);
    assertEquals(order.eq(pure(1), pure(2)), false);
    assertEquals(order.partialCmp(pure(1), pure(2)), some(greater as Ordering));
    assertEquals(order.partialCmp(pure(2), pure(1)), some(less as Ordering));
    assertEquals(order.partialCmp(pure(2), pure(2)), some(equal as Ordering));
});

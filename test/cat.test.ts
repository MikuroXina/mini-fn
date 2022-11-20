import { expect, test } from "vitest";

import { Cat } from "../src/lib";

test("Cat", () => {
    const result = Cat.cat(-3)
        .feed((x) => x ** 2)
        .feed((x) => x.toString());
    expect(result.value).toBe("9");
});

import { expect, test } from "vitest";

import { cat } from "../src/cat.js";

test("Cat", () => {
    const result = cat(-3)
        .feed((x) => x ** 2)
        .feed((x) => x.toString());
    expect(result.value).toBe("9");
});

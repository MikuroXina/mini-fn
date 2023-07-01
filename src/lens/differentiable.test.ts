import { expect, test } from "vitest";

import { asASetter, asGetting, get, set } from "../lens.js";
import { average } from "./differentiable.js";

test("average", () => {
    const data = [1, 2, 3];
    expect(get(asGetting(average))(data)).toEqual(2.0);
    expect(set(asASetter(average))(0)(data)).toEqual([-1, 0, 1]);
});

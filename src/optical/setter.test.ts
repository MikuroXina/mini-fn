import { expect, test } from "vitest";

import { functor } from "../array.js";
import { opticCat } from "../optical.js";
import { key } from "./lens.js";
import { setF } from "./setter.js";

test("double both elements of coord", () => {
    const coord = { hoge: 2, foo: [3, 1, 4, 1, 5, 9, 2] };
    expect(
        opticCat(coord)
            .feed(key("foo"))
            .setWith(setF(functor)((x) => x * 2)),
    ).toStrictEqual({ hoge: 2, foo: [6, 2, 8, 2, 10, 18, 4] });
});

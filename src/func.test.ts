import { abelianGroup, group } from "./func.ts";
import { addAbelianGroup } from "./number.ts";
import { assertEquals } from "../deps.ts";

Deno.test("group", () => {
    for (const make of [group, abelianGroup]) {
        const groupForFn = make<void, number>(addAbelianGroup);
        assertEquals(groupForFn.identity(), 0);
        assertEquals(
            groupForFn.combine(
                () => 1,
                () => 2,
            )(),
            3,
        );
        assertEquals(groupForFn.invert(() => 1)(), -1);
    }
});

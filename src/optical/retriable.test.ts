import { exponentialBackoff } from "./retriable.ts";
import { opticalCat } from "../optical.ts";
import { monad, PromiseHkt } from "../promise.ts";
import { err, ok } from "../result.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("exponential backoff", async () => {
    const optic = exponentialBackoff(3, () => Promise.resolve())(
        () => ({ bar: 3 } as Record<string, number>),
    )(
        (record: Record<string, number>) => (attempt) =>
            Promise.resolve(
                attempt === 2 ? ok(`OK ${record}`) : err("NOT_FOUND"),
            ),
    )((data: Record<string, number>) => (modified: string) => ({
        ...data,
        [modified]: modified.length,
    }));
    const res = await opticalCat<PromiseHkt>(monad)(
        { foo: 3 } as Record<string, number>,
    )
        .feed(optic).unwrap();
    assertEquals(res, "OK [object Object]");
});

import { expect, test } from "vitest";
import { opticalCat } from "../optical.js";
import { monad, type PromiseHkt } from "../promise.js";
import { err, ok } from "../result.js";
import { exponentialBackoff } from "./retriable.js";

test("exponential backoff", async () => {
    const optic = exponentialBackoff(3, () => Promise.resolve())(
        () => ({ bar: 3 }) as Record<string, number>,
    )(
        (record: Record<string, number>) => (attempt) =>
            Promise.resolve(
                attempt === 2 ? ok(`OK ${record}`) : err("NOT_FOUND"),
            ),
    )((data: Record<string, number>) => (modified: string) => ({
        ...data,
        [modified]: modified.length,
    }));
    const res = await opticalCat<PromiseHkt>(monad)({ foo: 3 } as Record<
        string,
        number
    >)
        .feed(optic)
        .unwrap();
    expect(res).toStrictEqual("OK [object Object]");
});

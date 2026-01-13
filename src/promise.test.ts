import { expect, test } from "vitest";
import { Cat, Promise, Result } from "../mod.js";

test("combine services", async () => {
    const serviceA = (): Promise<Result.Result<Error, string>> =>
        Promise.pure(Result.ok("foo"));
    const serviceB = (
        x: () => Promise<Result.Result<Error, string>>,
    ): Promise<Result.Result<Error, string>> =>
        Cat.doT(Promise.monadT(Result.traversableMonad<Error>()))
            .addM("x", x())
            .addM("y", x())
            .finish(({ x, y }) => `Hello, ${x} and ${y}!`);

    const res = await serviceB(serviceA);
    expect(res).toStrictEqual(Result.ok("Hello, foo and foo!"));
});

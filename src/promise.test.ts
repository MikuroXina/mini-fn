import { expect, test } from "vitest";
import { Array, Cat, Promise, Result } from "../mod.js";
import type { Apply2Only } from "./hkt.js";
import type { ResultHkt } from "./result.js";
import type { Apply } from "./type-class/apply.js";

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

test("productT", async () => {
    const product = Promise.productT(Result.semiGroupal<Error>());
    const pure = Promise.pureT(Result.monad<Error>());

    const actual = await product(pure("data"))(pure(42));

    expect(actual).toStrictEqual(Result.ok(["data", 42] as [string, number]));
});
test("applyT", async () => {
    const apply = Promise.applyT(
        Result.applicative<Error>() as Apply<Apply2Only<ResultHkt, Error>>,
    );
    const pure = Promise.pureT(Result.monad<Error>());

    const actual = await apply(pure((x: number) => x * 3))(pure(42));

    expect(actual).toStrictEqual(Result.ok(126));
});

test("monoid laws for PromiseT", async () => {
    const m = Promise.monoidT(Array.traversableMonad)([] as number[]);
    // associative
    const a = Promise.all([1, 4, 2]);
    const b = Promise.all([3, 5]);
    const c = Promise.all([2, 3]);
    expect(await m.combine(m.combine(a, b), c)).toStrictEqual(
        await m.combine(a, m.combine(b, c)),
    );

    // identity
    for (const item of [a, b, c]) {
        expect(await m.combine(m.identity, item)).toStrictEqual(await item);
        expect(await m.combine(item, m.identity)).toStrictEqual(await item);
    }
});
test("functor laws for PromiseT", () => {});
test("applicative functor laws for PromiseT", () => {});
test("monad laws for PromiseT", () => {});

test("product", () => {});
test("callCC", () => {});
test("tailRecM", () => {});

test("monoid laws for Promise", () => {});
test("functor laws for Promise", () => {});
test("applicative functor laws for Promise", () => {});
test("monad laws for Promise", () => {});

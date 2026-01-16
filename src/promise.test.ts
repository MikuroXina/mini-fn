import { expect, test } from "vitest";
import { Array, Cat, ControlFlow, Promise, Result } from "../mod.js";
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

test("functor laws for PromiseT", async () => {
    const f = Promise.functorT(Array.functor);
    // identity
    const x = Promise.pure([1, 4, 2, 3, 5, 2, 3]);
    expect(await f.map((x: number) => x)(x)).toStrictEqual(await x);

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    expect(await f.map((x: number) => mul2(add3(x)))(x)).toStrictEqual(
        await f.map(mul2)(f.map(add3)(x)),
    );
});
test("applicative functor laws for PromiseT", async () => {
    const f = Promise.applicativeT<Array.ArrayHkt>(Array.monad);
    // identity
    const x = Promise.pure([1, 4, 2, 3, 5, 2, 3]);
    expect(await f.apply(f.pure((i: number) => i))(x)).toStrictEqual(await x);

    // composition
    const add3 = Promise.pure([(x: number) => x + 3]);
    const mul2 = Promise.pure([(x: number) => x * 2]);
    expect(
        await f.apply(
            f.apply(
                f.apply(
                    f.pure(
                        (f: (x: number) => number) =>
                            (g: (x: number) => number) =>
                            (i: number) =>
                                f(g(i)),
                    ),
                )(add3),
            )(mul2),
        )(x),
    ).toStrictEqual(await f.apply(add3)(f.apply(mul2)(x)));

    // homomorphism
    const y = [3, 1, 4, 1, 5, 9, 2];
    const mul3 = (i: number[]): number[] => i.map((n: number) => n * 3);
    expect(await f.apply(f.pure(mul3))(f.pure(y))).toStrictEqual(
        await f.pure(mul3(y)),
    );

    // interchange
    for (let i = -10; i <= 10; ++i) {
        expect(await f.apply(add3)(f.pure(i))).toStrictEqual(
            await f.apply(f.pure((g: (x: number) => number) => g(i)))(add3),
        );
    }
});
test("monad laws for PromiseT", async () => {
    const m = Promise.monadT(Array.traversableMonad);
    // Left identity
    const f = async (n: number): Promise<number[]> =>
        n <= 0 ? [0] : [n, ...(await f(n - 1))];
    expect(await m.flatMap(f)(m.pure(3))).toStrictEqual(await f(3));

    // Right identity
    const x = Promise.pure([1, 4, 2, 3, 5, 2, 3]);
    expect(await m.flatMap(m.pure)(x)).toStrictEqual(await x);

    // Associativity
    const g = async (n: number) => (n < 2 ? [0] : [n, ...(await f(n / 2))]);
    expect(await m.flatMap(f)(m.flatMap(g)(x))).toStrictEqual(
        await m.flatMap((n: number) => m.flatMap(f)(g(n)))(x),
    );
});

test("product", async () => {
    for (let i = -10; i <= 10; ++i) {
        for (let j = -10; j <= 10; ++j) {
            expect(
                await Promise.product(Promise.pure(i))(Promise.pure(j)),
            ).toStrictEqual([i, j]);
        }
    }
});
test("callCC", async () => {
    const f = (x: number) =>
        Promise.callCC<number, string>(async (continuation) => {
            if (x < 1) {
                await continuation(2);
            }
            return 3;
        });
    expect(await f(0)).toStrictEqual(2);
    expect(await f(1)).toStrictEqual(3);
});
test("tailRecM", async () => {
    const f = (x: number) =>
        Promise.tailRecM(
            async ([s, i]: [string, number]): Promise<
                ControlFlow.ControlFlow<number, [string, number]>
            > =>
                s.endsWith("0")
                    ? ControlFlow.newBreak(parseInt(s, 10))
                    : ControlFlow.newContinue([`${s}${i - 1}`, i - 1]),
        )([`${x}`, x]);
    expect(await f(4)).toStrictEqual(43210);
    expect(await f(0)).toStrictEqual(0);
});

test("functor laws for Promise", async () => {
    const f = Promise.functor;
    // identity
    for (let x = -10; x <= 10; ++x) {
        expect(await f.map((x: number) => x)(Promise.pure(x))).toStrictEqual(x);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (let x = -10; x <= 10; ++x) {
        expect(
            await f.map((x: number) => add3(mul2(x)))(Promise.pure(x)),
        ).toStrictEqual(await f.map(add3)(f.map(mul2)(Promise.pure(x))));
    }
});
test("applicative functor laws for Promise", async () => {
    const a = Promise.applicative;
    // identity
    for (let x = -10; x <= 10; ++x) {
        expect(
            await a.apply(a.pure((i: number) => i))(Promise.pure(x)),
        ).toStrictEqual(x);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (let x = -10; x <= 10; ++x) {
        expect(
            await a.apply(
                a.apply(
                    a.apply(
                        a.pure(
                            (f: (i: number) => number) =>
                                (g: (i: number) => number) =>
                                (i: number) =>
                                    f(g(i)),
                        ),
                    )(Promise.pure(mul2)),
                )(Promise.pure(add3)),
            )(Promise.pure(x)),
        ).toStrictEqual(
            await a.apply(Promise.pure(mul2))(
                a.apply(Promise.pure(add3))(Promise.pure(x)),
            ),
        );
    }

    // homomorphism
    for (let x = -10; x <= 10; ++x) {
        expect(await a.apply(a.pure(mul2))(a.pure(x))).toStrictEqual(
            await a.pure(mul2(x)),
        );
    }

    // interchange
    const square = Promise.pure((x: number) => x * x);
    for (let x = -10; x <= 10; ++x) {
        expect(await a.apply(square)(a.pure(x))).toStrictEqual(
            await a.apply(a.pure((i: (x: number) => number) => i(x)))(square),
        );
    }
});
test("monad laws for Promise", async () => {
    const m = Promise.monad;
    // left identity
    const bang = async (x: string) => `${x}!`;
    const foo = "foo";
    expect(await m.flatMap(bang)(m.pure(foo))).toStrictEqual(await bang(foo));

    // right identity
    for (let x = -10; x <= 10; ++x) {
        expect(await m.flatMap(m.pure)(Promise.pure(x))).toStrictEqual(x);
    }

    // associativity
    const question = async (x: string) => `${x}?`;
    expect(
        await m.flatMap(bang)(m.flatMap(question)(Promise.pure(foo))),
    ).toStrictEqual(
        await m.flatMap((x: string) => m.flatMap(bang)(question(x)))(
            Promise.pure(foo),
        ),
    );
});

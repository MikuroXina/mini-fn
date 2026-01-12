import { expect, test, vi } from "vitest";
import type { ArrayHkt } from "./array.js";
import { doT } from "./cat.js";
import {
    type Cont,
    type ContT,
    callCC,
    evalCont,
    evalContT,
    guard,
    liftLocal,
    liftPromise,
    mapContT,
    monad,
    product,
    pure,
    pureT,
    reset,
    runContT,
    shift,
    unless,
    when,
    withContT,
} from "./cont.js";
import type { IdentityHkt } from "./identity.js";
import {
    type PromiseHkt,
    monad as promiseMonad,
    monadPromise as promiseMonadPromise,
} from "./promise.js";

test("runContT", () => {
    const calcLength = <A, R>(a: readonly A[]): Cont<R, number> =>
        pure(a.length);
    const double = <R>(num: number): Cont<R, number> => pure(num * 2);

    const cont = doT(monad<never[], IdentityHkt>())
        .addM("len", calcLength([1, 2, 3]))
        .finishM(({ len }) => double(len));

    const callback = vi.fn();
    runContT(cont)(callback);
    expect(callback).toHaveBeenCalledExactlyOnceWith(6);
});

test("evalContT", async () => {
    await evalContT(promiseMonad)(
        doT(monad<never[], PromiseHkt>())
            .addM("foo", pure(6))
            .runWith(({ foo }) => {
                expect(foo).toStrictEqual(6);
                return pure([]);
            })
            .finishM(() => pure([])),
    );
});

test("mapContT", () => {
    const res = mapContT<ArrayHkt, number>((data: readonly number[]) =>
        data.flatMap((x) => [x + 1, x + 2]),
    )(pureT<number, ArrayHkt, never[]>([]))(() => [1, 3]);
    expect(res).toStrictEqual([2, 3, 4, 5]);
});

test("withContT", () => {
    const cont = withContT<PromiseHkt, number, number, number>(
        (fn: (x: number) => Promise<number>) => async (x: number) =>
            await fn(x + 1),
    )((callback) => callback(42));

    const callback = vi.fn((): Promise<number> => Promise.resolve(2));
    runContT(cont)(callback);
    expect(callback).toHaveBeenCalledExactlyOnceWith(43);
});

test("callCC", () => {
    const validateName =
        (name: string) =>
        <R, M>(
            exit: (msg: string) => ContT<R, M, never[]>,
        ): ContT<R, M, never[]> =>
            when(name === "")(exit("failed reading name"));
    const assertCasing =
        (name: string) =>
        <R, M>(
            exit: (msg: string) => ContT<R, M, never[]>,
        ): ContT<R, M, never[]> => {
            const initial = name.charAt(0);
            return unless(initial === initial.toLocaleUpperCase())(
                exit("initial character must uppercase"),
            );
        };
    const greet = (name: string): string =>
        evalCont(
            callCC<string, IdentityHkt, string, never[]>((exit) =>
                doT(monad())
                    .run(validateName(name)(exit))
                    .run(assertCasing(name)(exit))
                    .finish(() => `Welcome, ${name}!`),
            ),
        );

    expect(greet("Alice"), "Welcome).toStrictEqual(Alice!");
    expect(greet("")).toStrictEqual("failed reading name");
});

test("shift and reset", () => {
    const actual = evalCont(
        reset<number, number>(
            doT(monad<number>())
                .addM(
                    "ret",
                    shift<number, number>((exit) =>
                        doT(monad<number>())
                            .addWith("x", () => exit(2))
                            .addWith("y", () => exit(3))
                            .finish(({ x, y }) => x * y),
                    ),
                )
                .finish(({ ret }) => 1 + ret),
        ),
    );
    expect(actual).toStrictEqual(12);
});

test("liftLocal", async () => {
    const lifted = liftLocal(promiseMonad)(Promise.resolve("foo"))<number>(
        (callback) => async (mr) => (await mr) + callback("").length - 1,
    )((text) => text + "!")(pure(1));
    const actual = await evalContT(promiseMonad)(lifted);
    expect(actual).toStrictEqual(3);
});

test("product", () => {
    const actual = evalCont(
        product<[number, number], IdentityHkt, number>(pure(2))(pure(3)),
    );
    expect(actual).toStrictEqual([2, 3]);
});

test("liftPromise", async () => {
    const lifted = liftPromise(promiseMonadPromise)<number, number>(
        Promise.resolve(42),
    );
    const actual = await evalContT(promiseMonad)(lifted);
    expect(actual).toStrictEqual(42);
});

test("guard", () => {
    evalCont(guard<never[]>(true));
    expect(() => evalCont(guard<never[]>(false))).toThrowError(
        "PANIC: absurd must not be called",
    );
});

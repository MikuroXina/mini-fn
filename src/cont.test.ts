import { doT } from "./cat.ts";
import {
    callCC,
    type Cont,
    type ContT,
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
} from "./cont.ts";
import { assertEquals, assertSpyCall, assertThrows, spy } from "../deps.ts";
import type { IdentityHkt } from "./identity.ts";
import {
    monad as promiseMonad,
    monadPromise as promiseMonadPromise,
    type PromiseHkt,
} from "./promise.ts";
import type { ArrayHkt } from "./array.ts";

Deno.test("runContT", () => {
    const calcLength = <A, R>(a: readonly A[]): Cont<R, number> =>
        pure(a.length);
    const double = <R>(num: number): Cont<R, number> => pure(num * 2);

    const cont = doT(monad<never[], IdentityHkt>())
        .addM("len", calcLength([1, 2, 3]))
        .finishM(({ len }) => double(len));

    const callback = spy(() => []);
    runContT(cont)(callback);
    assertSpyCall(callback, 0, {
        args: [6],
    });
});

Deno.test("evalContT", async () => {
    await evalContT(promiseMonad)(
        doT(monad<never[], PromiseHkt>())
            .addM("foo", pure(6))
            .runWith(({ foo }) => {
                assertEquals(foo, 6);
                return pure([]);
            })
            .finishM(() => pure([])),
    );
});

Deno.test("mapContT", () => {
    const res = mapContT<ArrayHkt, number>((data: readonly number[]) =>
        data.flatMap((x) => [x + 1, x + 2])
    )(
        pureT<number, ArrayHkt, never[]>([]),
    )(() => [1, 3]);
    assertEquals(res, [2, 3, 4, 5]);
});

Deno.test("withContT", () => {
    const cont = withContT<PromiseHkt, number, number, number>(
        (fn: (x: number) => Promise<number>) => async (x: number) =>
            await fn(x + 1),
    )((callback) => callback(42));

    const callback = spy((): Promise<number> => Promise.resolve(2));
    runContT(cont)(callback);
    assertSpyCall(callback, 0, {
        args: [43],
    });
});

Deno.test("callCC", () => {
    const validateName = (name: string) =>
    <R, M>(
        exit: (msg: string) => ContT<R, M, never[]>,
    ): ContT<R, M, never[]> => when(name === "")(exit("failed reading name"));
    const assertCasing = (name: string) =>
    <R, M>(
        exit: (msg: string) => ContT<R, M, never[]>,
    ): ContT<R, M, never[]> => {
        const initial = name.charAt(0);
        return unless(initial === initial.toLocaleUpperCase())(
            exit("initial character must uppercase"),
        );
    };
    const greet = (name: string): string =>
        evalCont(callCC<string, IdentityHkt, string, never[]>(
            (exit) =>
                doT(monad())
                    .run(validateName(name)(exit))
                    .run(assertCasing(name)(exit))
                    .finish(() => `Welcome, ${name}!`),
        ));

    assertEquals(greet("Alice"), "Welcome, Alice!");
    assertEquals(greet(""), "failed reading name");
});

Deno.test("shift and reset", () => {
    const actual = evalCont(reset<number, number>(
        doT(monad<number>())
            .addM(
                "ret",
                shift<number, number>((exit) =>
                    doT(monad<number>())
                        .addWith("x", () => exit(2))
                        .addWith("y", () => exit(3))
                        .finish(({ x, y }) => x * y)
                ),
            )
            .finish(({ ret }) => 1 + ret),
    ));
    assertEquals(actual, 12);
});

Deno.test("liftLocal", async () => {
    const lifted = liftLocal(promiseMonad)(Promise.resolve("foo"))<number>(
        (callback) => async (mr) => (await mr) + callback("").length - 1,
    )((text) => text + "!")(pure(1));
    const actual = await evalContT(promiseMonad)(lifted);
    assertEquals(actual, 3);
});

Deno.test("product", () => {
    const actual = evalCont(
        product<[number, number], IdentityHkt, number>(pure(2))(pure(3)),
    );
    assertEquals(actual, [2, 3]);
});

Deno.test("liftPromise", async () => {
    const lifted = liftPromise(promiseMonadPromise)<number, number>(
        Promise.resolve(42),
    );
    const actual = await evalContT(promiseMonad)(lifted);
    assertEquals(actual, 42);
});

Deno.test("guard", () => {
    evalCont(guard<never[]>(true));
    assertThrows(
        () => evalCont(guard<never[]>(false)),
        "PANIC: absurd must not be called",
    );
});

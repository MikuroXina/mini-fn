import { expect, test, vi } from "vitest";
import * as Array from "./array.js";
import {
    apply,
    cat,
    doFailT,
    doPlusT,
    doT,
    flatMap,
    flatten,
    get,
    inspect,
    map,
    product,
    withT,
} from "./cat.js";
import { newBreak, newContinue } from "./control-flow.js";
import type { Get1 } from "./hkt.js";
import * as Promise from "./promise.js";
import { get as getState, monad, put, runState } from "./state.js";
import type { MonadFail } from "./type-class/monad-fail.js";
import type { MonadPlus } from "./type-class/monad-plus.js";

const m = monad<number>();

test("when", () => {
    const comp = doT(m)
        .when(
            () => false,
            () => put(2),
        )
        .addM("x", getState())
        .runWith(({ x }) => {
            expect(x).toStrictEqual(0);
            return m.pure([]);
        })
        .when(
            () => true,
            () => put(3),
        )
        .addM("x", getState())
        .runWith(({ x }) => {
            expect(x).toStrictEqual(3);
            return m.pure([]);
        })
        .when(
            () => false,
            () => put(4),
        )
        .addM("x", getState())
        .runWith(({ x }) => {
            expect(x).toStrictEqual(3);
            return m.pure([]);
        })
        .finish(() => []);
    const res = runState(comp)(0);
    expect(res).toStrictEqual([[], 3]);
});

test("loop", () => {
    const mock = vi.fn<(s: string) => never[]>();
    runState(
        doT(m)
            .loop("", (state) => {
                mock(state);
                return m.pure(
                    state === "xxxxx" ? newBreak([]) : newContinue(`${state}x`),
                );
            })
            .finish(() => []),
    )(0);
    expect(mock.mock.calls.flat()).toStrictEqual([
        "",
        "x",
        "xx",
        "xxx",
        "xxxx",
        "xxxxx",
    ]);
});

test("while", () => {
    const mock = vi.fn<(x: number) => never[]>();
    runState(
        doT(m)
            .while(
                () => m.map((x: number) => x > 0)(getState()),
                () =>
                    doT(m)
                        .addM("x", getState())
                        .runWith(({ x }) => {
                            mock(x);
                            return put(x - 1);
                        })
                        .finish(() => []),
            )
            .finish(() => []),
    )(3);
    expect(mock.mock.calls.flat()).toStrictEqual([3, 2, 1]);
});

test("withT", () => {
    const res = runState(withT(m)({ x: 3 }).finish(({ x }) => x + 1))(0);
    expect(res).toStrictEqual([4, 0]);
});

test("get", () => {
    const contained = cat("foo");
    expect(get(contained)).toStrictEqual("foo");
});

test("inspect", () => {
    const mock = vi.fn<(s: string) => never[]>((_x: string) => []);

    const res = cat("foo").feed(inspect(mock)).value;

    expect(res).toStrictEqual("foo");
    expect(mock.mock.calls).toStrictEqual([["foo"]]);
});

test("flatten", () => {
    expect(flatten(cat(cat("bar"))).value).toStrictEqual("bar");
});

test("product", () => {
    expect(product(cat("baz"))(cat(8)).value).toStrictEqual(["baz", 8]);
});

test("map", () => {
    expect(map((x: number) => 2 * x)(cat(3)).value).toStrictEqual(6);
});

test("flatMap", () => {
    expect(flatMap((x: number) => cat(3 + x))(cat(39)).value).toStrictEqual(42);
});

test("apply", () => {
    expect(apply(cat((x: number) => x / 2))(cat(8)).value).toStrictEqual(4);
});

test("CatPlusT.assert", async () => {
    const findMod2And3 =
        <M>(mPlus: MonadPlus<M>) =>
        (nums: Get1<M, number>): Get1<M, number> =>
            doPlusT(mPlus)
                .addM("num", nums)
                .assert(({ num }) => num % 2 === 0)
                .assert(({ num }) => num % 3 === 0)
                .finish(({ num }) => num);

    expect(
        await findMod2And3(Promise.monadPlus)(Promise.pure(42)),
    ).toStrictEqual(42);
    await expect(
        findMod2And3(Promise.monadPlus)(Promise.pure(8)),
    ).rejects.toThrow();
    expect(
        findMod2And3(Array.monadPlus)([1, 4, 2, 3, 12, 34, 17, 8, 18, 9, 5, 6]),
    ).toStrictEqual([12, 18, 6]);
});

test("CatPlusT.alt", async () => {
    const div2Or3 =
        <M>(mPlus: MonadPlus<M>) =>
        (nums: Get1<M, number>): Get1<M, number> =>
            doPlusT(mPlus)
                .addM("num", nums)
                .alt("twoThree", (cat) =>
                    cat
                        .assert(({ num }) => num % 2 === 0)
                        .finish(({ num }) => num / 2),
                )
                .or((cat) =>
                    cat
                        .assert(({ num }) => num % 3 === 0)
                        .finish(({ num }) => num / 3),
                )
                .end()
                .finish(({ twoThree }) => twoThree);

    expect(await div2Or3(Promise.monadPlus)(Promise.pure(42))).toStrictEqual(
        21,
    );
    expect(await div2Or3(Promise.monadPlus)(Promise.pure(15))).toStrictEqual(5);
    await expect(
        div2Or3(Promise.monadPlus)(Promise.pure(41)),
    ).rejects.toThrow();
});

test("CatFailT.fail", async () => {
    const findMod2And3 =
        <M>(mFail: MonadFail<M>) =>
        (nums: Get1<M, number>): Get1<M, number> =>
            doFailT(mFail)
                .addM("num", nums)
                .assert(
                    ({ num }) => num % 2 === 0,
                    "expected num to be mod of 2",
                )
                .assert(
                    ({ num }) => num % 3 === 0,
                    "expected num to be mod of 3",
                )
                .finish(({ num }) => num);

    expect(
        await findMod2And3(Promise.monadFail)(Promise.pure(42)),
    ).toStrictEqual(42);
    await expect(
        findMod2And3(Promise.monadFail)(Promise.pure(8)),
    ).rejects.toThrow("expected num to be mod of 3");
    await expect(
        findMod2And3(Promise.monadFail)(Promise.pure(3)),
    ).rejects.toThrow("expected num to be mod of 2");
    expect(
        findMod2And3(Array.monadFail)([1, 4, 2, 3, 12, 34, 17, 8, 18, 9, 5, 6]),
    ).toStrictEqual([12, 18, 6]);
});

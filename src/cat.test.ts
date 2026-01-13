import { expect, test, vi } from "vitest";
import {
    apply,
    cat,
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
import { get as getState, monad, put, runState } from "./state.js";

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

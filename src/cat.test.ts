import { assertEquals, spy } from "../deps.ts";
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
} from "./cat.ts";
import { newBreak, newContinue } from "./control-flow.ts";
import { get as getState, monad, put, runState } from "./state.ts";

const m = monad<number>();

Deno.test("when", () => {
    const comp = doT(m)
        .when(() => false, () => put(2))
        .addM("x", getState())
        .runWith(({ x }) => {
            assertEquals(x, 0);
            return m.pure([]);
        })
        .when(() => true, () => put(3))
        .addM("x", getState())
        .runWith(({ x }) => {
            assertEquals(x, 3);
            return m.pure([]);
        })
        .when(() => false, () => put(4))
        .addM("x", getState())
        .runWith(({ x }) => {
            assertEquals(x, 3);
            return m.pure([]);
        }).finish(() => []);
    const res = runState(comp)(0);
    assertEquals(res, [[], 3]);
});

Deno.test("loop", () => {
    const mock = spy((_x: string) => []);
    runState(
        doT(m).loop(
            "",
            (state) => {
                mock(state);
                return m.pure(
                    state === "xxxxx" ? newBreak([]) : newContinue(state + "x"),
                );
            },
        ).finish(() => []),
    )(0);
    assertEquals(mock.calls.flatMap(({ args }) => args), [
        "",
        "x",
        "xx",
        "xxx",
        "xxxx",
        "xxxxx",
    ]);
});

Deno.test("while", () => {
    const mock = spy((_x: number) => []);
    runState(
        doT(m).while(
            () => m.map((x: number) => x > 0)(getState()),
            () =>
                doT(m).addM("x", getState())
                    .runWith(({ x }) => {
                        mock(x);
                        return put(x - 1);
                    })
                    .finish(() => []),
        ).finish(() => []),
    )(3);
    assertEquals(mock.calls.flatMap(({ args }) => args), [
        3,
        2,
        1,
    ]);
});

Deno.test("withT", () => {
    const res = runState(withT(m)({ x: 3 }).finish(({ x }) => x + 1))(0);
    assertEquals(res, [4, 0]);
});

Deno.test("get", () => {
    const contained = cat("foo");
    assertEquals(get(contained), "foo");
});

Deno.test("inspect", () => {
    const mock = spy((_x: string) => []);

    const res = cat("foo")
        .feed(inspect(mock)).value;

    assertEquals(res, "foo");
    assertEquals(mock.calls[0].args, ["foo"]);
});

Deno.test("flatten", () => {
    assertEquals(flatten(cat(cat("bar"))).value, "bar");
});

Deno.test("product", () => {
    assertEquals(product(cat("baz"))(cat(8)).value, ["baz", 8]);
});

Deno.test("map", () => {
    assertEquals(map((x: number) => 2 * x)(cat(3)).value, 6);
});

Deno.test("flatMap", () => {
    assertEquals(flatMap((x: number) => cat(3 + x))(cat(39)).value, 42);
});

Deno.test("apply", () => {
    assertEquals(apply(cat((x: number) => x / 2))(cat(8)).value, 4);
});

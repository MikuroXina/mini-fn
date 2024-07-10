import { assertEquals } from "../deps.ts";
import {
    cmp,
    dec,
    enc,
    equality,
    foldR,
    fromReduce,
    monad,
    partialCmp,
    partialEquality,
    reduceL,
    reduceR,
    traverse,
} from "./array.ts";
import { range, reduce } from "./list.ts";
import { some } from "./option.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { monad as promiseMonad, type PromiseHkt } from "./promise.ts";
import { unwrap } from "./result.ts";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.ts";
import { stringEq } from "./type-class/eq.ts";
import { stringOrd } from "./type-class/ord.ts";
import { strict } from "./type-class/partial-eq.ts";

Deno.test("partial equality", () => {
    const partialEq = partialEquality(strict<number>());

    assertEquals(partialEq([], []), true);
    assertEquals(partialEq([0], [0]), true);
    assertEquals(partialEq([2], [2]), true);

    assertEquals(partialEq([], [1]), false);
    assertEquals(partialEq([1], []), false);
    assertEquals(partialEq([0], [0, 3]), false);
    assertEquals(partialEq([4, 0], [0]), false);
});

Deno.test("equality", () => {
    const eq = equality(stringEq);

    assertEquals(eq([], []), true);
    assertEquals(eq(["0"], ["0"]), true);
    assertEquals(eq(["2"], ["2"]), true);

    assertEquals(eq([], ["1"]), false);
    assertEquals(eq(["1"], []), false);
    assertEquals(eq(["0"], ["0", "3"]), false);
    assertEquals(eq(["4", "0"], ["0"]), false);
});

Deno.test("partial order", () => {
    const cmp = partialCmp(stringOrd);

    assertEquals(cmp([], []), some<Ordering>(equal));
    assertEquals(cmp(["0"], ["0"]), some<Ordering>(equal));
    assertEquals(cmp(["2"], ["2"]), some<Ordering>(equal));

    assertEquals(cmp([], ["1"]), some<Ordering>(less));
    assertEquals(cmp(["0"], ["0", "3"]), some<Ordering>(less));
    assertEquals(cmp(["1"], []), some<Ordering>(greater));
    assertEquals(cmp(["4", "0"], ["0"]), some<Ordering>(greater));
});

Deno.test("total order", () => {
    const totalCmp = cmp(stringOrd);

    assertEquals(totalCmp([], []), equal);
    assertEquals(totalCmp(["0"], ["0"]), equal);
    assertEquals(totalCmp(["2"], ["2"]), equal);

    assertEquals(totalCmp([], ["1"]), less);
    assertEquals(totalCmp(["0"], ["0", "3"]), less);
    assertEquals(totalCmp(["1"], []), greater);
    assertEquals(totalCmp(["4", "0"], ["0"]), greater);
});

const sub = (next: number) => (acc: number) => next - acc;

Deno.test("foldR", () => {
    assertEquals(
        foldR(sub)(0)([]),
        0,
    );

    const actual = foldR(sub)(0)([
        1,
        4,
        2,
        3,
        5,
        2,
        3,
    ]);
    assertEquals(actual, 2);
});

Deno.test("traverse", async () => {
    const actual = await traverse<PromiseHkt>(promiseMonad)((item: string) =>
        Promise.resolve(item.length)
    )(["foo", "hoge"]);
    assertEquals(actual, [3, 4]);
});

Deno.test("functor", () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    // identity
    assertEquals(
        monad.map((x: number) => x)(data),
        data,
    );

    // composition
    const alpha = (x: number) => x + 3;
    const beta = (x: number) => x * 4;
    assertEquals(
        monad.map((x: number) => beta(alpha(x)))(data),
        monad.map(beta)(monad.map(alpha)(data)),
    );
});

Deno.test("applicative", () => {
    type NumToNum = (i: number) => number;
    // identity
    {
        const x = [1, 4, 2, 3, 5, 2, 3];
        assertEquals(monad.apply(monad.pure((i: number) => i))(x), x);
    }

    // composition
    {
        const x = [(i: number) => i + 3, (i: number) => i * 4];
        const y = [(i: number) => i + 5, (i: number) => i * 3];
        const z = [1, 4, 2, 3, 5, 2, 3];
        assertEquals(
            monad.apply(
                monad.apply(
                    monad.apply(
                        monad.pure(
                            (f: NumToNum) =>
                            (g: NumToNum): NumToNum =>
                            (i: number) => f(g(i)),
                        ),
                    )(x),
                )(y),
            )(z),
            monad.apply(x)(monad.apply(y)(z)),
        );
    }

    // homomorphism
    {
        const x = 42;
        const add = (x: number) => [x + 1, x + 2, x + 3];
        assertEquals(
            monad.apply(monad.pure(add))(monad.pure(x)),
            monad.pure(add(x)),
        );
    }

    // interchange
    {
        const f = [(i: number) => i + 3, (i: number) => i * 4];
        const x = 42;
        assertEquals(
            monad.apply(f)(monad.pure(x)),
            monad.apply(monad.pure((i: NumToNum) => i(x)))(f),
        );
    }
});

Deno.test("monad", () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    const add = (x: number) => [x + 1, x + 2, x + 3];
    const mul = (x: number) => [x * 2, x * 3, x * 4];

    // left identity
    assertEquals(monad.flatMap(add)(monad.pure(1)), add(1));
    assertEquals(monad.flatMap(mul)(monad.pure(1)), mul(1));

    // right identity
    assertEquals(monad.flatMap(monad.pure)(data), data);

    // associativity
    assertEquals(
        monad.flatMap(add)(monad.flatMap(mul)(data)),
        monad.flatMap((x: number) => monad.flatMap(add)(mul(x)))(data),
    );
});

Deno.test("fromReduce", () => {
    const actual = fromReduce(reduce)(range(0, 4));
    assertEquals(actual, [0, 1, 2, 3]);
});

Deno.test("reduceR", () => {
    assertEquals(reduceR(sub)([])(0), 0);

    const actual = reduceR(sub)([1, 4, 2, 3, 5, 2, 3])(0);
    assertEquals(actual, 2);
});

Deno.test("reduceL", () => {
    assertEquals(reduceL(sub)(0)([]), 0);

    const actual = reduceL(sub)(0)([1, 4, 2, 3, 5, 2, 3]);
    assertEquals(actual, -20);
});

Deno.test("encode then decode", async () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    const code = await runCode(enc(encU32Be)(data));
    const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
    assertEquals(decoded, data);
});

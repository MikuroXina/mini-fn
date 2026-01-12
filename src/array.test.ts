import { expect, test } from "vitest";
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
} from "./array.js";
import { range, reduce } from "./list.js";
import { some } from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { type PromiseHkt, monad as promiseMonad } from "./promise.js";
import { unwrap } from "./result.js";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.js";
import { stringEq } from "./type-class/eq.js";
import { stringOrd } from "./type-class/ord.js";
import { strict } from "./type-class/partial-eq.js";

test("partial equality", () => {
    const partialEq = partialEquality(strict<number>());

    expect(partialEq([], [])).toStrictEqual(true);
    expect(partialEq([0], [0])).toStrictEqual(true);
    expect(partialEq([2], [2])).toStrictEqual(true);

    expect(partialEq([], [1])).toStrictEqual(false);
    expect(partialEq([1], [])).toStrictEqual(false);
    expect(partialEq([0], [0, 3])).toStrictEqual(false);
    expect(partialEq([4, 0], [0])).toStrictEqual(false);
});

test("equality", () => {
    const eq = equality(stringEq);

    expect(eq([], [])).toStrictEqual(true);
    expect(eq(["0"], ["0"])).toStrictEqual(true);
    expect(eq(["2"], ["2"])).toStrictEqual(true);

    expect(eq([], ["1"])).toStrictEqual(false);
    expect(eq(["1"], [])).toStrictEqual(false);
    expect(eq(["0"], ["0", "3"])).toStrictEqual(false);
    expect(eq(["4", "0"], ["0"])).toStrictEqual(false);
});

test("partial order", () => {
    const cmp = partialCmp(stringOrd);

    expect(cmp([], [])).toStrictEqual(some<Ordering>(equal));
    expect(cmp(["0"], ["0"])).toStrictEqual(some<Ordering>(equal));
    expect(cmp(["2"], ["2"])).toStrictEqual(some<Ordering>(equal));

    expect(cmp([], ["1"])).toStrictEqual(some<Ordering>(less));
    expect(cmp(["0"], ["0", "3"])).toStrictEqual(some<Ordering>(less));
    expect(cmp(["1"], [])).toStrictEqual(some<Ordering>(greater));
    expect(cmp(["4", "0"], ["0"])).toStrictEqual(some<Ordering>(greater));
});

test("total order", () => {
    const totalCmp = cmp(stringOrd);

    expect(totalCmp([], [])).toStrictEqual(equal);
    expect(totalCmp(["0"], ["0"])).toStrictEqual(equal);
    expect(totalCmp(["2"], ["2"])).toStrictEqual(equal);

    expect(totalCmp([], ["1"])).toStrictEqual(less);
    expect(totalCmp(["0"], ["0", "3"])).toStrictEqual(less);
    expect(totalCmp(["1"], [])).toStrictEqual(greater);
    expect(totalCmp(["4", "0"], ["0"])).toStrictEqual(greater);
});

const sub = (next: number) => (acc: number) => next - acc;

test("foldR", () => {
    expect(foldR(sub)(0)([])).toStrictEqual(0);

    const actual = foldR(sub)(0)([1, 4, 2, 3, 5, 2, 3]);
    expect(actual).toStrictEqual(2);
});

test("traverse", async () => {
    const actual = await traverse<PromiseHkt>(promiseMonad)((item: string) =>
        Promise.resolve(item.length),
    )(["foo", "hoge"]);
    expect(actual).toStrictEqual([3, 4]);
});

test("functor", () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    // identity
    expect(monad.map((x: number) => x)(data)).toStrictEqual(data);

    // composition
    const alpha = (x: number) => x + 3;
    const beta = (x: number) => x * 4;
    expect(monad.map((x: number) => beta(alpha(x)))(data)).toStrictEqual(
        monad.map(beta)(monad.map(alpha)(data)),
    );
});

test("applicative", () => {
    type NumToNum = (i: number) => number;
    // identity
    {
        const x = [1, 4, 2, 3, 5, 2, 3];
        expect(monad.apply(monad.pure((i: number) => i))(x)).toStrictEqual(x);
    }

    // composition
    {
        const x = [(i: number) => i + 3, (i: number) => i * 4];
        const y = [(i: number) => i + 5, (i: number) => i * 3];
        const z = [1, 4, 2, 3, 5, 2, 3];
        expect(
            monad.apply(
                monad.apply(
                    monad.apply(
                        monad.pure(
                            (f: NumToNum) =>
                                (g: NumToNum): NumToNum =>
                                (i: number) =>
                                    f(g(i)),
                        ),
                    )(x),
                )(y),
            )(z),
        ).toStrictEqual(monad.apply(x)(monad.apply(y)(z)));
    }

    // homomorphism
    {
        const x = 42;
        const add = (x: number) => [x + 1, x + 2, x + 3];
        expect(monad.apply(monad.pure(add))(monad.pure(x))).toStrictEqual(
            monad.pure(add(x)),
        );
    }

    // interchange
    {
        const f = [(i: number) => i + 3, (i: number) => i * 4];
        const x = 42;
        expect(monad.apply(f)(monad.pure(x))).toStrictEqual(
            monad.apply(monad.pure((i: NumToNum) => i(x)))(f),
        );
    }
});

test("monad", () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    const add = (x: number) => [x + 1, x + 2, x + 3];
    const mul = (x: number) => [x * 2, x * 3, x * 4];

    // left identity
    expect(monad.flatMap(add)(monad.pure(1))).toStrictEqual(add(1));
    expect(monad.flatMap(mul)(monad.pure(1))).toStrictEqual(mul(1));

    // right identity
    expect(monad.flatMap(monad.pure)(data)).toStrictEqual(data);

    // associativity
    expect(monad.flatMap(add)(monad.flatMap(mul)(data))).toStrictEqual(
        monad.flatMap((x: number) => monad.flatMap(add)(mul(x)))(data),
    );
});

test("fromReduce", () => {
    const actual = fromReduce(reduce)(range(0, 4));
    expect(actual).toStrictEqual([0, 1, 2, 3]);
});

test("reduceR", () => {
    expect(reduceR(sub)([])(0)).toStrictEqual(0);

    const actual = reduceR(sub)([1, 4, 2, 3, 5, 2, 3])(0);
    expect(actual).toStrictEqual(2);
});

test("reduceL", () => {
    expect(reduceL(sub)(0)([])).toStrictEqual(0);

    const actual = reduceL(sub)(0)([1, 4, 2, 3, 5, 2, 3]);
    expect(actual).toStrictEqual(-20);
});

test("encode then decode", () => {
    const data = [1, 4, 2, 3, 5, 2, 3];
    const code = runCode(enc(encU32Be)(data));
    const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
    expect(decoded).toStrictEqual(data);
});

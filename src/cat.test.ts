import { expect, test } from "vitest";

import { apply, type Cat, cat, doT, flatMap, inspect, map, product } from "./cat.js";
import { monad, none, some } from "./option.js";

test("doT", () => {
    const optionA = some(1);
    const optionB = some(2);
    const optionC = some(3);

    const computation = doT(monad)
        .let("a", optionA)
        .let("b", optionB)
        .thenLet("bSquared", ({ b }) => b * b)
        .let("c", optionC);

    expect(
        computation
            .flatLet("cSqrt", ({ c }) => {
                const sqrt = Math.sqrt(c);
                return Number.isInteger(sqrt) ? some(sqrt) : none();
            })
            .finish(({ bSquared, cSqrt }) => bSquared + cSqrt),
    ).toStrictEqual(none());

    const result = computation.finish(({ a, b, c }) => a + b + c);
    expect(result).toStrictEqual(some(6));
});

test("cat", () => {
    const result = cat(-3)
        .feed((x) => x ** 2)
        .feed((x) => x.toString());
    expect(result.value).toBe("9");
});

test("inspect", () => {
    const result = cat(-3)
        .feed(inspect((x) => expect(x).toBe(-3)))
        .feed((x) => x ** 2)
        .feed(inspect((x) => expect(x).toBe(9)))
        .feed((x) => x.toString())
        .feed(inspect((x) => expect(x).toBe("9")));
    expect(result.value).toBe("9");
});

test("product", () => {
    const actual = product(cat(5))(cat("foo")).value;
    expect(actual).toEqual([5, "foo"]);
});

test("map", () => {
    const actual = map((v: number) => v / 2)(cat(10)).value;
    expect(actual).toBe(5);
});

test("flatMap", () => {
    const sub = (num: number): Cat<string> => cat(num).feed((x) => x.toString());
    const actual = flatMap(sub)(cat(6)).value;
    expect(actual).toBe("6");
});

test("apply", () => {
    const sub = cat((numeral: string) => parseInt(numeral, 10));
    const actual = apply(sub)(cat("1024")).value;
    expect(actual).toBe(1024);
});

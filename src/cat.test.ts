import { expect, test } from "vitest";

import { type Cat, apply, cat, flatMap, inspect, map, product } from "./cat.js";

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

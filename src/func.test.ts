import { absurd, constant, flip, id, until } from "./func.js";
import { expect, test } from "vitest";

test("id", () => {
    expect(id(2)).toBe(2);
    expect(id("foo")).toBe("foo");
});

test("constant", () => {
    const fn = constant(4);
    expect(fn(3)).toBe(4);
    expect(fn("foo")).toBe(4);
});

test("absurd", () => {
    expect(() => {
        absurd<number>();
        throw new Error("this line must not be run");
    }).toThrowError("PANIC: absurd must not be called");
});

test("flip", () => {
    const fn = flip((a: string) => (b: string) => a + b);
    expect(fn("a")("b")).toEqual("ba");
    expect(fn("asd")("btg")).toEqual("btgasd");
});

test("until", () => {
    const padLeft = until((x: string) => 4 <= x.length)((x) => "0" + x);
    expect(padLeft("")).toBe("0000");
    expect(padLeft("1")).toBe("0001");
    expect(padLeft("13")).toBe("0013");
    expect(padLeft("131")).toBe("0131");
    expect(padLeft("1316")).toBe("1316");
    expect(padLeft("1316534")).toBe("1316534");
});

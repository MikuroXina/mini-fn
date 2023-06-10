import { expect, test } from "vitest";

import {
    abelianGroup,
    abelianGroupExceptZero,
    absurd,
    constant,
    flip,
    group,
    groupExceptZero,
    id,
    until,
} from "./func.js";
import { addAbelianGroup } from "./number.js";

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

test("group", () => {
    for (const make of [groupExceptZero, group, abelianGroupExceptZero, abelianGroup]) {
        const groupForFn = make<void, number>(addAbelianGroup);
        expect(groupForFn.identity()).toBe(0);
        expect(
            groupForFn.combine(
                () => 1,
                () => 2,
            )(),
        ).toBe(3);
        expect(groupForFn.invert(() => 1)()).toBe(-1);
    }
});

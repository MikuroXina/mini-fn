import { expect, test } from "vitest";

import {
    abelianGroup,
    abelianGroupExceptZero,
    absurd,
    apply,
    compose,
    constant,
    flatMap,
    flip,
    group,
    groupExceptZero,
    id,
    liftBinary,
    map,
    pipe,
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

test("pipe", () => {
    expect(pipe((x: number) => x + 1)((x) => x * 2)(3)).toBe(8);
});

test("compose", () => {
    expect(compose((x: number) => x + 1)((x: number) => x * 2)(3)).toBe(7);
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

test("map", () => {
    const mapper = map<string>()((x: number) => x * 2);
    expect(mapper(parseInt)("20")).toBe(40);
});

test("apply", () => {
    const applier = apply<string>()((str) => (radix: number) => parseInt(str, radix));
    expect(applier(parseInt)("11")).toBe(12);
});

test("liftBinary", () => {
    const lifter = liftBinary<void>()((a: number) => (b: number) => a + b);
    expect(lifter(() => 1)(() => 2)()).toBe(3);
});

test("flatMap", () => {
    const mapper = flatMap<number>()((x: number) => (y: number) => x * y);
    expect(mapper((x) => x + 1)(3)).toBe(12);
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

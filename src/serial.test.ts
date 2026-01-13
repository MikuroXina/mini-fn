import { expect, test } from "vitest";
import { doT } from "./cat.js";
import { encU8, encU16Be, encU32Be, monadForCodeM, runCode } from "./serial.js";

test("single integer", () => {
    const code = encU8(42);
    const buf = runCode(code);
    expect(new Uint8Array(buf)[0]).toStrictEqual(42);
});

test("multiple integers", () => {
    const code = doT(monadForCodeM)
        .run(encU8(3))
        .run(encU16Be(1))
        .run(encU32Be(4))
        .finish(() => []);
    const buf = runCode(code);
    const array = new Uint8Array(buf);
    expect(array[0]).toStrictEqual(3);
    expect(array[1]).toStrictEqual(0);
    expect(array[2]).toStrictEqual(1);
    expect(array[3]).toStrictEqual(0);
    expect(array[4]).toStrictEqual(0);
    expect(array[5]).toStrictEqual(0);
    expect(array[6]).toStrictEqual(4);
});

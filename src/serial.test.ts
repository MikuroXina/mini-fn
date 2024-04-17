import { assertEquals } from "../deps.ts";
import { doT } from "./cat.ts";
import { encU16Be, encU32Be, encU8, monadForCodeM, runCode } from "./serial.ts";

Deno.test("single integer", async () => {
    const code = encU8(42);
    const buf = await runCode(code);
    assertEquals(new Uint8Array(buf)[0], 42);
});

Deno.test("multiple integers", async () => {
    const code = doT(monadForCodeM)
        .run(encU8(3))
        .run(encU16Be(1))
        .run(encU32Be(4))
        .finish<[]>(() => []);
    const buf = await runCode(code);
    const array = new Uint8Array(buf);
    assertEquals(array[0], 3);
    assertEquals(array[1], 0);
    assertEquals(array[2], 1);
    assertEquals(array[3], 0);
    assertEquals(array[4], 0);
    assertEquals(array[5], 0);
    assertEquals(array[6], 4);
});

import { assertEquals } from "../deps.ts";
import { andMonoid, dec, enc, equality, orMonoid } from "./bool.ts";
import { unwrap } from "./result.ts";
import { runCode, runDecoder } from "./serial.ts";

const patterns = [false, true];
const patterns2 = patterns.flatMap((x) => patterns.map((y) => [x, y]));
const patterns3 = patterns.flatMap((x) => patterns2.map((ys) => [x, ...ys]));

Deno.test("logical and monoid", () => {
    // associative
    for (const [x, y, z] of patterns3) {
        assertEquals(
            andMonoid.combine(andMonoid.combine(x, y), z),
            andMonoid.combine(x, andMonoid.combine(y, z)),
        );
    }

    // identity
    for (const x of patterns) {
        assertEquals(andMonoid.combine(andMonoid.identity, x), x);
        assertEquals(andMonoid.combine(x, andMonoid.identity), x);
    }
});

Deno.test("logical or monoid", () => {
    // associative
    for (const [x, y, z] of patterns3) {
        assertEquals(
            orMonoid.combine(orMonoid.combine(x, y), z),
            orMonoid.combine(x, orMonoid.combine(y, z)),
        );
    }

    // identity
    for (const x of patterns) {
        assertEquals(orMonoid.combine(orMonoid.identity, x), x);
        assertEquals(orMonoid.combine(x, orMonoid.identity), x);
    }
});

Deno.test("equality", () => {
    for (const [x, y] of patterns2) {
        assertEquals(equality(x, y), x === y);
    }
});

Deno.test("encode then decode", async () => {
    for (const x of patterns) {
        const code = await runCode(enc()(x));
        const decoded = unwrap(runDecoder(dec())(code));
        assertEquals(decoded, x);
    }
});

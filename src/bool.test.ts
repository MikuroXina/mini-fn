import { expect, test } from "vitest";
import { andMonoid, dec, enc, equality, orMonoid } from "./bool.js";
import { unwrap } from "./result.js";
import { runCode, runDecoder } from "./serial.js";

const patterns = [false, true];
const patterns2 = patterns.flatMap((x) =>
    patterns.map((y) => [x, y] as [boolean, boolean]),
);
const patterns3 = patterns.flatMap((x) =>
    patterns2.map((ys) => [x, ...ys] as [boolean, boolean, boolean]),
);

test("logical and monoid", () => {
    // associative
    for (const [x, y, z] of patterns3) {
        expect(andMonoid.combine(andMonoid.combine(x, y), z)).toStrictEqual(
            andMonoid.combine(x, andMonoid.combine(y, z)),
        );
    }

    // identity
    for (const x of patterns) {
        expect(andMonoid.combine(andMonoid.identity, x)).toStrictEqual(x);
        expect(andMonoid.combine(x, andMonoid.identity)).toStrictEqual(x);
    }
});

test("logical or monoid", () => {
    // associative
    for (const [x, y, z] of patterns3) {
        expect(orMonoid.combine(orMonoid.combine(x, y), z)).toStrictEqual(
            orMonoid.combine(x, orMonoid.combine(y, z)),
        );
    }

    // identity
    for (const x of patterns) {
        expect(orMonoid.combine(orMonoid.identity, x)).toStrictEqual(x);
        expect(orMonoid.combine(x, orMonoid.identity)).toStrictEqual(x);
    }
});

test("equality", () => {
    for (const [x, y] of patterns2) {
        expect(equality(x, y)).toStrictEqual(x === y);
    }
});

test("encode then decode", () => {
    for (const x of patterns) {
        const code = runCode(enc()(x));
        const decoded = unwrap(runDecoder(dec())(code));
        expect(decoded).toStrictEqual(x);
    }
});

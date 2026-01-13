import { expect, test } from "vitest";
import { String } from "../../mod.js";
import { fromIterable } from "../list.js";
import {
    addMonoid,
    append,
    concat,
    flippedMonoid,
    maxMonoid,
    minMonoid,
    mulMonoid,
    trivialMonoid,
} from "./monoid.js";

test("append", () => {
    expect(append(addMonoid)(2)(3)).toStrictEqual(5);
});
test("concat", () => {
    expect(concat(String.monoid)(fromIterable([]))).toStrictEqual("");
    expect(concat(String.monoid)(fromIterable(["go"]))).toStrictEqual("go");
    expect(concat(String.monoid)(fromIterable(["go", "to"]))).toStrictEqual(
        "goto",
    );
});

test("trivial monoid", () => {
    const m = trivialMonoid;
    // associative
    expect(m.combine(m.combine([], []), [])).toStrictEqual(
        m.combine([], m.combine([], [])),
    );

    // identity
    expect(m.combine([], m.identity)).toStrictEqual([]);
    expect(m.combine(m.identity, [])).toStrictEqual([]);
});
test("flipped monoid", () => {
    const m = flippedMonoid(String.monoid);

    // associative
    expect(m.combine(m.combine("a", "b"), "c")).toStrictEqual(
        m.combine("a", m.combine("b", "c")),
    );

    // identity
    for (const x of ["", "a", "bar"]) {
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});
test("addition monoid", () => {
    const m = addMonoid;

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                expect(m.combine(m.combine(x, y), z)).toStrictEqual(
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});
test("multiplication monoid", () => {
    const m = mulMonoid;

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                expect(m.combine(m.combine(x, y), z)).toStrictEqual(
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});
test("minimum monoid", () => {
    const m = minMonoid(8001);

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                expect(m.combine(m.combine(x, y), z)).toStrictEqual(
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});
test("maximum monoid", () => {
    const m = maxMonoid(-8001);

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                expect(m.combine(m.combine(x, y), z)).toStrictEqual(
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});

import { assertEquals } from "../../deps.ts";
import { String } from "../../mod.ts";
import { fromIterable } from "../list.ts";
import {
    addMonoid,
    append,
    concat,
    flippedMonoid,
    maxMonoid,
    minMonoid,
    mulMonoid,
    trivialMonoid,
} from "./monoid.ts";

Deno.test("append", () => {
    assertEquals(append(addMonoid)(2)(3), 5);
});
Deno.test("concat", () => {
    assertEquals(concat(String.monoid)(fromIterable([])), "");
    assertEquals(concat(String.monoid)(fromIterable(["go"])), "go");
    assertEquals(concat(String.monoid)(fromIterable(["go", "to"])), "goto");
});

Deno.test("trivial monoid", () => {
    const m = trivialMonoid;
    // associative
    assertEquals(
        m.combine(m.combine([], []), []),
        m.combine([], m.combine([], [])),
    );

    // identity
    assertEquals(m.combine([], m.identity), []);
    assertEquals(m.combine(m.identity, []), []);
});
Deno.test("flipped monoid", () => {
    const m = flippedMonoid(String.monoid);

    // associative
    assertEquals(
        m.combine(m.combine("a", "b"), "c"),
        m.combine("a", m.combine("b", "c")),
    );

    // identity
    for (const x of ["", "a", "bar"]) {
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});
Deno.test("addition monoid", () => {
    const m = addMonoid;

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                assertEquals(
                    m.combine(m.combine(x, y), z),
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});
Deno.test("multiplication monoid", () => {
    const m = mulMonoid;

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                assertEquals(
                    m.combine(m.combine(x, y), z),
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});
Deno.test("minimum monoid", () => {
    const m = minMonoid(8001);

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                assertEquals(
                    m.combine(m.combine(x, y), z),
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});
Deno.test("maximum monoid", () => {
    const m = maxMonoid(-8001);

    for (let x = -20; x <= 20; ++x) {
        for (let y = -20; y <= 20; ++y) {
            for (let z = -20; z <= 20; ++z) {
                assertEquals(
                    m.combine(m.combine(x, y), z),
                    m.combine(x, m.combine(y, z)),
                );
            }
        }
    }

    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});

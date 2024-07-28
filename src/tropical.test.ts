import { assertEquals, assertThrows } from "../deps.ts";
import { none, type Option, some } from "./option.ts";
import { fromNumber, fromNumberChecked, semiRing } from "./tropical.ts";

Deno.test("fromNumber", () => {
    assertEquals(fromNumber(-42), -42);
    assertEquals(fromNumber(-0), -0);
    assertEquals(fromNumber(0), 0);
    assertEquals(fromNumber(42), 42);
    assertEquals(fromNumber(Infinity), Infinity);
    assertThrows(() => fromNumber(-Infinity));
    assertThrows(() => fromNumber(NaN));
});

Deno.test("fromNumberChecked", () => {
    assertEquals(fromNumberChecked(-42) as Option<number>, some(-42));
    assertEquals(fromNumberChecked(-0) as Option<number>, some(-0));
    assertEquals(fromNumberChecked(0) as Option<number>, some(0));
    assertEquals(fromNumberChecked(42) as Option<number>, some(42));
    assertEquals(fromNumberChecked(Infinity) as Option<number>, some(Infinity));
    assertEquals(fromNumberChecked(-Infinity), none());
    assertEquals(fromNumberChecked(NaN), none());
});

Deno.test("semi ring laws", () => {
    const { additive, multiplication } = semiRing;

    const x = fromNumber(-42);
    const y = fromNumber(0);
    const z = fromNumber(42);

    // additive associative
    assertEquals(
        additive.combine(x, additive.combine(y, z)),
        additive.combine(additive.combine(x, y), z),
    );

    // additive identity
    for (const v of [x, y, z]) {
        assertEquals(additive.combine(v, additive.identity), v);
        assertEquals(additive.combine(additive.identity, v), v);
    }

    // multiplication associative
    assertEquals(
        multiplication.combine(x, multiplication.combine(y, z)),
        multiplication.combine(multiplication.combine(x, y), z),
    );

    // multiplication identity
    for (const v of [x, y, z]) {
        assertEquals(multiplication.combine(v, multiplication.identity), v);
        assertEquals(multiplication.combine(multiplication.identity, v), v);
    }

    // zero * x = x * zero = zero
    for (const v of [x, y, z]) {
        assertEquals(
            multiplication.combine(additive.identity, v),
            additive.identity,
        );
        assertEquals(
            multiplication.combine(v, additive.identity),
            additive.identity,
        );
    }
});

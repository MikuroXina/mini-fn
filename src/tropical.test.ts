import { expect, test } from "vitest";
import { none, type Option, some } from "./option.js";
import { fromNumber, fromNumberChecked, semiRing } from "./tropical.js";

test("fromNumber", () => {
    expect(fromNumber(-42)).toStrictEqual(-42);
    expect(fromNumber(-0)).toStrictEqual(-0);
    expect(fromNumber(0)).toStrictEqual(0);
    expect(fromNumber(42)).toStrictEqual(42);
    expect(fromNumber(Infinity)).toStrictEqual(Infinity);
    expect(() => fromNumber(-Infinity)).toThrow();
    expect(() => fromNumber(NaN)).toThrow();
});

test("fromNumberChecked", () => {
    expect(fromNumberChecked(-42) as Option<number>).toStrictEqual(some(-42));
    expect(fromNumberChecked(-0) as Option<number>).toStrictEqual(some(-0));
    expect(fromNumberChecked(0) as Option<number>).toStrictEqual(some(0));
    expect(fromNumberChecked(42) as Option<number>).toStrictEqual(some(42));
    expect(fromNumberChecked(Infinity) as Option<number>).toStrictEqual(
        some(Infinity),
    );
    expect(fromNumberChecked(-Infinity)).toStrictEqual(none());
    expect(fromNumberChecked(NaN)).toStrictEqual(none());
});

test("semi ring laws", () => {
    const { additive, multiplication } = semiRing;

    const x = fromNumber(-42);
    const y = fromNumber(0);
    const z = fromNumber(42);

    // additive associative
    expect(additive.combine(x, additive.combine(y, z))).toStrictEqual(
        additive.combine(additive.combine(x, y), z),
    );

    // additive identity
    for (const v of [x, y, z]) {
        expect(additive.combine(v, additive.identity)).toStrictEqual(v);
        expect(additive.combine(additive.identity, v)).toStrictEqual(v);
    }

    // multiplication associative
    expect(
        multiplication.combine(x, multiplication.combine(y, z)),
    ).toStrictEqual(multiplication.combine(multiplication.combine(x, y), z));

    // multiplication identity
    for (const v of [x, y, z]) {
        expect(
            multiplication.combine(v, multiplication.identity),
        ).toStrictEqual(v);
        expect(
            multiplication.combine(multiplication.identity, v),
        ).toStrictEqual(v);
    }

    // zero * x = x * zero = zero
    for (const v of [x, y, z]) {
        expect(multiplication.combine(additive.identity, v)).toStrictEqual(
            additive.identity,
        );
        expect(multiplication.combine(v, additive.identity)).toStrictEqual(
            additive.identity,
        );
    }
});

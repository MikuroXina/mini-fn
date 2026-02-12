import { expect, test } from "vitest";
import * as Matrix from "./matrix.js";
import { unwrap } from "./result.js";
import { runCode, runDecoder } from "./serial.js";

test("identity", () => {
    const m = Matrix.identity(4)(3);
    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 3; ++j) {
            const elem = Matrix.at(i)(j)(m);
            if (i === j) {
                expect(elem).toStrictEqual(1);
            } else {
                expect(elem).toStrictEqual(0);
            }
        }
    }
});
test("zeroes", () => {
    const m = Matrix.zeroes(4)(3);
    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 3; ++j) {
            const elem = Matrix.at(i)(j)(m);
            expect(elem).toStrictEqual(0);
        }
    }
});
test("fromRows", () => {
    const m = Matrix.fromRows([
        [1, 2, 3],
        [4, 5, 6, 7],
        [8, 9],
    ]);
    expect(Matrix.at(0)(0)(m)).toStrictEqual(1);
    expect(Matrix.at(0)(1)(m)).toStrictEqual(2);
    expect(Matrix.at(0)(2)(m)).toStrictEqual(3);
    expect(Matrix.at(0)(3)(m)).toStrictEqual(0);
    expect(Matrix.at(1)(0)(m)).toStrictEqual(4);
    expect(Matrix.at(1)(1)(m)).toStrictEqual(5);
    expect(Matrix.at(1)(2)(m)).toStrictEqual(6);
    expect(Matrix.at(1)(3)(m)).toStrictEqual(7);
    expect(Matrix.at(2)(0)(m)).toStrictEqual(8);
    expect(Matrix.at(2)(1)(m)).toStrictEqual(9);
    expect(Matrix.at(2)(2)(m)).toStrictEqual(0);
    expect(Matrix.at(2)(3)(m)).toStrictEqual(0);
});
test("fromColumns", () => {
    const m = Matrix.fromColumns([
        [1, 2, 3],
        [4, 5, 6, 7],
        [8, 9],
    ]);
    expect(Matrix.at(0)(0)(m)).toStrictEqual(1);
    expect(Matrix.at(1)(0)(m)).toStrictEqual(2);
    expect(Matrix.at(2)(0)(m)).toStrictEqual(3);
    expect(Matrix.at(3)(0)(m)).toStrictEqual(0);
    expect(Matrix.at(0)(1)(m)).toStrictEqual(4);
    expect(Matrix.at(1)(1)(m)).toStrictEqual(5);
    expect(Matrix.at(2)(1)(m)).toStrictEqual(6);
    expect(Matrix.at(3)(1)(m)).toStrictEqual(7);
    expect(Matrix.at(0)(2)(m)).toStrictEqual(8);
    expect(Matrix.at(1)(2)(m)).toStrictEqual(9);
    expect(Matrix.at(2)(2)(m)).toStrictEqual(0);
    expect(Matrix.at(3)(2)(m)).toStrictEqual(0);
});
test("at but out of range", () => {
    const m = Matrix.zeroes(4)(3);

    expect(Matrix.at(0)(0)(m)).toStrictEqual(0);
    expect(Matrix.at(3)(0)(m)).toStrictEqual(0);
    expect(Matrix.at(0)(2)(m)).toStrictEqual(0);
    expect(Matrix.at(3)(2)(m)).toStrictEqual(0);

    expect(() => Matrix.at(0)(-1)(m)).toThrow();
    expect(() => Matrix.at(-1)(0)(m)).toThrow();
    expect(() => Matrix.at(0)(3)(m)).toThrow();
    expect(() => Matrix.at(4)(0)(m)).toThrow();
});
test("rowLength", () => {
    expect(Matrix.rowLength(Matrix.identity(4)(3))).toStrictEqual(3);
});
test("columnLength", () => {
    expect(Matrix.columnLength(Matrix.identity(4)(3))).toStrictEqual(4);
});
test("isMajorAxisRow", () => {
    const m = Matrix.zeroes(4)(3);
    expect(Matrix.isMajorAxisRow(m)).toStrictEqual(true);
});
test("trace", () => {
    expect(Matrix.trace(Matrix.zeros(5)(1))).toStrictEqual(0);
    expect(Matrix.trace(Matrix.identity(2)(4))).toStrictEqual(2);
});
test("transpose", () => {
    const m = Matrix.identity(5)(3);
    const t = Matrix.transpose(m);

    expect(Matrix.columnLength(t)).toStrictEqual(3);
    expect(Matrix.rowLength(t)).toStrictEqual(5);
    expect(Matrix.trace(t)).toStrictEqual(3);
});
test("scalarProduct", () => {
    const i = Matrix.identity(4)(4);
    const alphaI = Matrix.scalarProduct(1.5)(i);
    expect(Matrix.trace(alphaI)).toStrictEqual(6);
});
test("interchangeMajorAxis", () => {
    {
        const m = Matrix.fromRows([
            [1, 2, 3],
            [4, 5, 6],
        ]);
        const t = Matrix.interchangeMajorAxis(m);
        expect(t.strides).toStrictEqual([1, 2]);
    }
    {
        const m = Matrix.fromColumns([
            [1, 2, 3],
            [4, 5, 6],
        ]);
        const t = Matrix.interchangeMajorAxis(m);
        expect(t.strides).toStrictEqual([2, 1]);
    }
});
test("add", () => {
    const added = Matrix.add(
        Matrix.fromRows([
            [1, 4, 3],
            [2, 3, 5],
        ]),
    )(
        Matrix.fromColumns([
            [4, 7],
            [6, 9],
            [0, 1],
        ]),
    );
    expect(
        Matrix.partialEquality(
            added,
            Matrix.fromRows([
                [5, 10, 3],
                [9, 12, 6],
            ]),
        ),
    ).toStrictEqual(true);
    expect(() =>
        Matrix.add(Matrix.identity(1)(2))(Matrix.identity(3)(2)),
    ).toThrow();
});
test("mul", () => {
    const multiplied = Matrix.mul(
        Matrix.fromRows([
            [1, 1],
            [0, 1],
        ]),
    )(
        Matrix.fromRows([
            [3, 4],
            [-5, 2],
        ]),
    );
    expect(
        Matrix.partialEquality(
            multiplied,
            Matrix.fromRows([
                [-2, 6],
                [-5, 2],
            ]),
        ),
    ).toStrictEqual(true);
    expect(() =>
        Matrix.mul(Matrix.identity(1)(2))(Matrix.identity(3)(2)),
    ).toThrow();
});
test("mulElementWise", () => {
    const multiplied = Matrix.mulElementWise(
        Matrix.fromRows([
            [-5, 7],
            [4, 4],
        ]),
    )(
        Matrix.fromRows([
            [2, 6],
            [8, -3],
        ]),
    );
    expect(
        Matrix.partialEquality(
            multiplied,
            Matrix.fromRows([
                [-10, 42],
                [32, -12],
            ]),
        ),
    ).toStrictEqual(true);
});

test("add monoid laws", () => {
    const m = Matrix.addMonoid(2)(2);
    const a = Matrix.fromRows([
        [1, 4],
        [2, 3],
    ]);
    const b = Matrix.fromRows([
        [5, 2],
        [3, 6],
    ]);
    const c = Matrix.fromRows([
        [0, 4],
        [5, 4],
    ]);

    // associative
    expect(
        Matrix.partialEquality(
            m.combine(a, m.combine(b, c)),
            m.combine(m.combine(a, b), c),
        ),
    ).toStrictEqual(true);

    // identity
    for (const x of [a, b, c]) {
        expect(
            Matrix.partialEquality(m.combine(x, m.identity), x),
        ).toStrictEqual(true);
        expect(
            Matrix.partialEquality(m.combine(m.identity, x), x),
        ).toStrictEqual(true);
    }
});
test("add group laws", () => {
    const g = Matrix.addGroup(2)(2);
    const a = Matrix.fromRows([
        [1, 4],
        [2, 3],
    ]);
    const b = Matrix.fromRows([
        [5, 2],
        [3, 6],
    ]);
    const c = Matrix.fromRows([
        [0, 4],
        [5, 4],
    ]);

    // inverse
    for (const x of [a, b, c]) {
        expect(
            Matrix.partialEquality(g.combine(x, g.invert(x)), g.identity),
        ).toStrictEqual(true);
        expect(
            Matrix.partialEquality(g.combine(g.invert(x), x), g.identity),
        ).toStrictEqual(true);
    }
});
test("mul monoid laws", () => {
    const m = Matrix.mulMonoid(2)(2);
    const a = Matrix.fromRows([
        [1, 4],
        [2, 3],
    ]);
    const b = Matrix.fromRows([
        [5, 2],
        [3, 6],
    ]);
    const c = Matrix.fromRows([
        [0, 4],
        [5, 4],
    ]);

    // associative
    expect(
        Matrix.partialEquality(
            m.combine(a, m.combine(b, c)),
            m.combine(m.combine(a, b), c),
        ),
    ).toStrictEqual(true);

    // identity
    for (const x of [a, b, c]) {
        expect(
            Matrix.partialEquality(m.combine(x, m.identity), x),
        ).toStrictEqual(true);
        expect(
            Matrix.partialEquality(m.combine(m.identity, x), x),
        ).toStrictEqual(true);
    }
});
test("ring laws", () => {
    const r = Matrix.ring(2)(2);
    const a = Matrix.fromRows([
        [1, 4],
        [2, 3],
    ]);
    const b = Matrix.fromRows([
        [5, 2],
        [3, 6],
    ]);
    const c = Matrix.fromRows([
        [0, 4],
        [5, 4],
    ]);

    // distributive
    expect(
        Matrix.partialEquality(
            r.multiplication.combine(a, r.additive.combine(b, c)),
            r.additive.combine(
                r.multiplication.combine(a, b),
                r.multiplication.combine(a, c),
            ),
        ),
    ).toStrictEqual(true);
});

test("encode then decode", () => {
    const a = Matrix.fromRows([
        [1, 4],
        [2, 3],
    ]);
    const b = Matrix.fromRows([
        [5, 2],
        [3, 6],
    ]);
    const c = Matrix.fromRows([
        [0, 4],
        [5, 4],
    ]);

    for (const x of [a, b, c]) {
        const serial = runCode(Matrix.enc(x));
        const decoded = unwrap(runDecoder(Matrix.dec())(serial));
        expect(Matrix.partialEquality(x, decoded)).toStrictEqual(true);
    }
});

import { assertEquals, assertThrows } from "../deps.ts";
import { Matrix } from "../mod.ts";
import { unwrap } from "./result.ts";
import { runCode, runDecoder } from "./serial.ts";

Deno.test("identity", () => {
    const m = Matrix.identity(4)(3);
    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 3; ++j) {
            const elem = Matrix.at(i)(j)(m);
            if (i === j) {
                assertEquals(elem, 1);
            } else {
                assertEquals(elem, 0);
            }
        }
    }
});
Deno.test("zeroes", () => {
    const m = Matrix.zeroes(4)(3);
    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 3; ++j) {
            const elem = Matrix.at(i)(j)(m);
            assertEquals(elem, 0);
        }
    }
});
Deno.test("fromRows", () => {
    const m = Matrix.fromRows([
        [1, 2, 3],
        [4, 5, 6, 7],
        [8, 9],
    ]);
    assertEquals(Matrix.at(0)(0)(m), 1);
    assertEquals(Matrix.at(0)(1)(m), 2);
    assertEquals(Matrix.at(0)(2)(m), 3);
    assertEquals(Matrix.at(0)(3)(m), 0);
    assertEquals(Matrix.at(1)(0)(m), 4);
    assertEquals(Matrix.at(1)(1)(m), 5);
    assertEquals(Matrix.at(1)(2)(m), 6);
    assertEquals(Matrix.at(1)(3)(m), 7);
    assertEquals(Matrix.at(2)(0)(m), 8);
    assertEquals(Matrix.at(2)(1)(m), 9);
    assertEquals(Matrix.at(2)(2)(m), 0);
    assertEquals(Matrix.at(2)(3)(m), 0);
});
Deno.test("fromColumns", () => {
    const m = Matrix.fromColumns([
        [1, 2, 3],
        [4, 5, 6, 7],
        [8, 9],
    ]);
    assertEquals(Matrix.at(0)(0)(m), 1);
    assertEquals(Matrix.at(1)(0)(m), 2);
    assertEquals(Matrix.at(2)(0)(m), 3);
    assertEquals(Matrix.at(3)(0)(m), 0);
    assertEquals(Matrix.at(0)(1)(m), 4);
    assertEquals(Matrix.at(1)(1)(m), 5);
    assertEquals(Matrix.at(2)(1)(m), 6);
    assertEquals(Matrix.at(3)(1)(m), 7);
    assertEquals(Matrix.at(0)(2)(m), 8);
    assertEquals(Matrix.at(1)(2)(m), 9);
    assertEquals(Matrix.at(2)(2)(m), 0);
    assertEquals(Matrix.at(3)(2)(m), 0);
});
Deno.test("at but out of range", () => {
    const m = Matrix.zeroes(4)(3);

    assertEquals(Matrix.at(0)(0)(m), 0);
    assertEquals(Matrix.at(3)(0)(m), 0);
    assertEquals(Matrix.at(0)(2)(m), 0);
    assertEquals(Matrix.at(3)(2)(m), 0);

    assertThrows(() => Matrix.at(0)(-1)(m));
    assertThrows(() => Matrix.at(-1)(0)(m));
    assertThrows(() => Matrix.at(0)(3)(m));
    assertThrows(() => Matrix.at(4)(0)(m));
});
Deno.test("rowLength", () => {
    assertEquals(Matrix.rowLength(Matrix.identity(4)(3)), 3);
});
Deno.test("columnLength", () => {
    assertEquals(Matrix.columnLength(Matrix.identity(4)(3)), 4);
});
Deno.test("isMajorAxisRow", () => {
    const m = Matrix.zeroes(4)(3);
    assertEquals(Matrix.isMajorAxisRow(m), true);
});
Deno.test("trace", () => {
    assertEquals(Matrix.trace(Matrix.zeros(5)(1)), 0);
    assertEquals(Matrix.trace(Matrix.identity(2)(4)), 2);
});
Deno.test("transpose", () => {
    const m = Matrix.identity(5)(3);
    const t = Matrix.transpose(m);

    assertEquals(Matrix.columnLength(t), 3);
    assertEquals(Matrix.rowLength(t), 5);
    assertEquals(Matrix.trace(t), 3);
});
Deno.test("scalarProduct", () => {
    const i = Matrix.identity(4)(4);
    const alphaI = Matrix.scalarProduct(1.5)(i);
    assertEquals(Matrix.trace(alphaI), 6);
});
Deno.test("interchangeMajorAxis", () => {
    {
        const m = Matrix.fromRows([
            [1, 2, 3],
            [4, 5, 6],
        ]);
        const t = Matrix.interchangeMajorAxis(m);
        assertEquals(t.strides, [1, 2]);
    }
    {
        const m = Matrix.fromColumns([
            [1, 2, 3],
            [4, 5, 6],
        ]);
        const t = Matrix.interchangeMajorAxis(m);
        assertEquals(t.strides, [2, 1]);
    }
});
Deno.test("add", () => {
    const added = Matrix.add(Matrix.fromRows([
        [1, 4, 3],
        [2, 3, 5],
    ]))(Matrix.fromColumns([
        [4, 7],
        [6, 9],
        [0, 1],
    ]));
    assertEquals(
        Matrix.partialEquality(
            added,
            Matrix.fromRows([
                [5, 10, 3],
                [9, 12, 6],
            ]),
        ),
        true,
    );
    assertThrows(() =>
        Matrix.add(Matrix.identity(1)(2))(Matrix.identity(3)(2))
    );
});
Deno.test("mul", () => {
    const multiplied = Matrix.mul(Matrix.fromRows([
        [1, 1],
        [0, 1],
    ]))(Matrix.fromRows([
        [3, 4],
        [-5, 2],
    ]));
    assertEquals(
        Matrix.partialEquality(
            multiplied,
            Matrix.fromRows([
                [-2, 6],
                [-5, 2],
            ]),
        ),
        true,
    );
    assertThrows(() =>
        Matrix.mul(Matrix.identity(1)(2))(Matrix.identity(3)(2))
    );
});
Deno.test("mulElementWise", () => {
    const multiplied = Matrix.mulElementWise(Matrix.fromRows([
        [-5, 7],
        [4, 4],
    ]))(Matrix.fromRows([
        [2, 6],
        [8, -3],
    ]));
    assertEquals(
        Matrix.partialEquality(
            multiplied,
            Matrix.fromRows([
                [-10, 42],
                [32, -12],
            ]),
        ),
        true,
    );
});

Deno.test("add monoid laws", () => {
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
    assertEquals(
        Matrix.partialEquality(
            m.combine(a, m.combine(b, c)),
            m.combine(m.combine(a, b), c),
        ),
        true,
    );

    // identity
    for (const x of [a, b, c]) {
        assertEquals(Matrix.partialEquality(m.combine(x, m.identity), x), true);
        assertEquals(Matrix.partialEquality(m.combine(m.identity, x), x), true);
    }
});
Deno.test("add group laws", () => {
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
        assertEquals(
            Matrix.partialEquality(g.combine(x, g.invert(x)), g.identity),
            true,
        );
        assertEquals(
            Matrix.partialEquality(g.combine(g.invert(x), x), g.identity),
            true,
        );
    }
});
Deno.test("mul monoid laws", () => {
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
    assertEquals(
        Matrix.partialEquality(
            m.combine(a, m.combine(b, c)),
            m.combine(m.combine(a, b), c),
        ),
        true,
    );

    // identity
    for (const x of [a, b, c]) {
        assertEquals(Matrix.partialEquality(m.combine(x, m.identity), x), true);
        assertEquals(Matrix.partialEquality(m.combine(m.identity, x), x), true);
    }
});
Deno.test("ring laws", () => {
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
    assertEquals(
        Matrix.partialEquality(
            r.multiplication.combine(a, r.additive.combine(b, c)),
            r.additive.combine(
                r.multiplication.combine(a, b),
                r.multiplication.combine(a, c),
            ),
        ),
        true,
    );
});

Deno.test("encode then decode", () => {
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
        assertEquals(Matrix.partialEquality(x, decoded), true);
    }
});

import { assertEquals, assertThrows } from "../deps.ts";
import { List, Number, These, Tuple } from "../mod.ts";
import { unwrap } from "./result.ts";
import {
    decI32Be,
    decUtf8,
    encI32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.ts";
import { semiGroup } from "./string.ts";
import { nonNanOrd, stringOrd } from "./type-class/ord.ts";

Deno.test("partial equality", () => {
    const equality = These.partialEq(Number.partialOrd, stringOrd);

    assertEquals(equality.eq(These.newThis(2), These.newThat("2")), false);
    assertEquals(equality.eq(These.newThis(2), These.newBoth(2)("2")), false);
    assertEquals(equality.eq(These.newThat("2"), These.newBoth(2)("2")), false);
    assertEquals(equality.eq(These.newThat("2"), These.newThis(2)), false);
    assertEquals(equality.eq(These.newBoth(2)("2"), These.newThis(2)), false);
    assertEquals(equality.eq(These.newBoth(2)("2"), These.newThat("2")), false);

    assertEquals(equality.eq(These.newThis(0), These.newThis(2)), false);
    assertEquals(equality.eq(These.newThis(0), These.newThis(0)), true);
    assertEquals(equality.eq(These.newThis(2), These.newThis(0)), false);
    assertEquals(equality.eq(These.newThis(NaN), These.newThis(NaN)), false);

    assertEquals(equality.eq(These.newThat("0"), These.newThat("2")), false);
    assertEquals(equality.eq(These.newThat("0"), These.newThat("0")), true);
    assertEquals(equality.eq(These.newThat("2"), These.newThat("0")), false);

    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("0")),
        true,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("2"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("2"), These.newBoth(2)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("2"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("0")),
        true,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("2"), These.newBoth(2)("0")),
        false,
    );
});
Deno.test("equality", () => {
    const equality = These.eq(nonNanOrd, stringOrd);

    assertEquals(equality.eq(These.newThis(2), These.newThat("2")), false);
    assertEquals(equality.eq(These.newThis(2), These.newBoth(2)("2")), false);
    assertEquals(equality.eq(These.newThat("2"), These.newBoth(2)("2")), false);
    assertEquals(equality.eq(These.newThat("2"), These.newThis(2)), false);
    assertEquals(equality.eq(These.newBoth(2)("2"), These.newThis(2)), false);
    assertEquals(equality.eq(These.newBoth(2)("2"), These.newThat("2")), false);

    assertEquals(equality.eq(These.newThis(0), These.newThis(2)), false);
    assertEquals(equality.eq(These.newThis(0), These.newThis(0)), true);
    assertEquals(equality.eq(These.newThis(2), These.newThis(0)), false);
    assertThrows(
        () => {
            equality.eq(These.newThis(NaN), These.newThis(NaN));
        },
        "NaN detected",
    );

    assertEquals(equality.eq(These.newThat("0"), These.newThat("2")), false);
    assertEquals(equality.eq(These.newThat("0"), These.newThat("0")), true);
    assertEquals(equality.eq(These.newThat("2"), These.newThat("0")), false);

    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("0")),
        true,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("2"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(0)("2"), These.newBoth(2)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("2"), These.newBoth(0)("0")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("2")),
        false,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("0")),
        true,
    );
    assertEquals(
        equality.eq(These.newBoth(2)("2"), These.newBoth(2)("0")),
        false,
    );
});

Deno.test("type assertion", () => {
    assertEquals(These.isThis(These.newThis("foo")), true);
    assertEquals(These.isThis(These.newThat("foo")), false);
    assertEquals(These.isThis(These.newBoth("foo")("bar")), false);

    assertEquals(These.isThat(These.newThis("foo")), false);
    assertEquals(These.isThat(These.newThat("foo")), true);
    assertEquals(These.isThat(These.newBoth("foo")("bar")), false);

    assertEquals(These.isBoth(These.newThis("foo")), false);
    assertEquals(These.isBoth(These.newThat("foo")), false);
    assertEquals(These.isBoth(These.newBoth("foo")("bar")), true);
});
Deno.test("intoTuple", () => {
    const applied = These.intoTuple("foo")(42);

    assertEquals(applied(These.newThis("bar")), ["bar", 42]);
    assertEquals(applied(These.newThat(314)), ["foo", 314]);
    assertEquals(applied(These.newBoth("e")(218)), ["e", 218]);
});
Deno.test("merge", () => {
    const applied = These.merge((x: number) => (y: number) => x + y);

    assertEquals(applied(These.newThis(2)), 2);
    assertEquals(applied(These.newThat(3)), 3);
    assertEquals(applied(These.newBoth(2)(3)), 5);
});
Deno.test("mergeWith", () => {
    const applied = These.mergeWith((x: number) => x.toString(16))((
        x: number,
    ) => x.toString(8))((x) => (y) => x + y);

    assertEquals(applied(These.newThis(42)), "2a");
    assertEquals(applied(These.newThat(24)), "30");
    assertEquals(applied(These.newBoth(13)(68)), "d104");
});
Deno.test("partition", () => {
    const [thisItems, thatItems, bothItems] = These.partition(
        List.fromIterable([
            These.newThis("foo"),
            These.newThat(63),
            These.newThis("bar"),
            These.newBoth("baz")(82),
            These.newThat(88),
        ]),
    );
    assertEquals(List.toArray(thisItems), ["foo", "bar"]);
    assertEquals(List.toArray(thatItems), [63, 88]);
    assertEquals(List.toArray(bothItems), [["baz", 82]]);
});
Deno.test("distributeTheseTuple", () => {
    assertEquals(
        These.distributeTheseTuple(These.newThis(Tuple.make(6)("x"))),
        [These.newThis(6), These.newThis("x")],
    );
    assertEquals(
        These.distributeTheseTuple(These.newThat("y")),
        [These.newThat("y"), These.newThat("y")],
    );
    assertEquals(
        These.distributeTheseTuple(These.newBoth(Tuple.make(9)("z"))(10)),
        [These.newBoth(9)(10), These.newBoth("z")(10)],
    );
});
Deno.test("undistributeTheseTuple", () => {
    assertEquals(
        These.undistributeTheseTuple([These.newThis(6), These.newThis("x")]),
        These.newThis(Tuple.make(6)("x")),
    );
    assertEquals(
        These.undistributeTheseTuple([These.newThat("y"), These.newThat("y")]),
        These.newThat("y"),
    );
    assertEquals(
        These.undistributeTheseTuple([
            These.newBoth(9)(10),
            These.newBoth("z")(10),
        ]),
        These.newBoth(Tuple.make(9)("z"))(10),
    );
});
Deno.test("distributeTupleThese", () => {
    assertEquals(
        These.distributeTupleThese(
            [These.newThis(6), 91],
        ),
        These.newThis(Tuple.make(6)(91)),
    );
    assertEquals(
        These.distributeTupleThese(
            [These.newThat("g"), 91],
        ),
        These.newThat(Tuple.make("g")(91)),
    );
    assertEquals(
        These.distributeTupleThese(
            [These.newBoth("h")(7), 91],
        ),
        These.newBoth(Tuple.make("h")(91))(Tuple.make(7)(91)),
    );
});
Deno.test("undistributeTupleThese", () => {
    assertEquals(
        These.undistributeTupleThese(
            These.newThis(Tuple.make(6)(91)),
        ),
        [These.newThis(6), 91],
    );
    assertEquals(
        These.undistributeTupleThese(
            These.newThat(Tuple.make("g")(91)),
        ),
        [These.newThat("g"), 91],
    );
    assertEquals(
        These.undistributeTupleThese(
            These.newBoth(Tuple.make("h")(91))(Tuple.make(7)(91)),
        ),
        [These.newBoth("h")(7), 91],
    );
});
Deno.test("combine", () => {
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newThis("y"),
        ),
        These.newThis("xy"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newThat("y"),
        ),
        These.newBoth("x")("y"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newBoth("y")("z"),
        ),
        These.newBoth("xy")("z"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newThis("y"),
        ),
        These.newBoth("y")("x"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newThat("y"),
        ),
        These.newThat("xy"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newBoth("y")("z"),
        ),
        These.newBoth("y")("xz"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newThis("z"),
        ),
        These.newBoth("xz")("y"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newThat("z"),
        ),
        These.newBoth("x")("yz"),
    );
    assertEquals(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newBoth("z")("a"),
        ),
        These.newBoth("xz")("ya"),
    );
});

Deno.test("semi-group laws", () => {
    const g = These.semiGroup(semiGroup, semiGroup);
    const items = [
        These.newThis("a"),
        These.newThat("b"),
        These.newBoth("c")("d"),
    ];

    // associative
    for (const x of items) {
        for (const y of items) {
            for (const z of items) {
                assertEquals(
                    g.combine(x, g.combine(y, z)),
                    g.combine(g.combine(x, y), z),
                );
            }
        }
    }
});
Deno.test("functor laws", () => {
    const f = These.functor<number>();

    // identity
    for (
        const t of [
            These.newThis(2),
            These.newThat("foo"),
            These.newBoth(8)("bar"),
        ]
    ) {
        assertEquals(f.map((x: string) => x)(t), t);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (
        const t of [
            These.newThis(2),
            These.newThat(88),
            These.newBoth(8)(53),
        ]
    ) {
        f.map((x: number) => add3(mul2(x)))(t), f.map(add3)(f.map(mul2)(t));
    }
});
Deno.test("applicative functor laws", () => {
    const app = These.app(Number.addAbelianGroup);

    // identity
    for (
        const t of [
            These.newThis(2),
            These.newThat(88),
            These.newBoth(8)(53),
        ]
    ) {
        assertEquals(app.apply(app.pure((x: number) => x))(t), t);
    }

    // composition
    for (
        const x of [
            These.newThis(2),
            These.newThat((x: number) => x + 3),
            These.newBoth(8)((x: number) => x + 3),
        ]
    ) {
        for (
            const y of [
                These.newThis(3),
                These.newThat((x: number) => x * 2),
                These.newBoth(9)((x: number) => x * 2),
            ]
        ) {
            for (
                const z of [
                    These.newThis(4),
                    These.newThat(88),
                    These.newBoth(10)(53),
                ]
            ) {
                assertEquals(
                    app.apply(
                        app.apply(
                            app.apply(
                                app.pure(
                                    (f: (x: number) => number) =>
                                    (g: (x: number) => number) =>
                                    (x: number) => f(g(x)),
                                ),
                            )(x),
                        )(y),
                    )(z),
                    app.apply(x)(app.apply(y)(z)),
                );
            }
        }
    }

    // homomorphism
    const invert = (x: number) => ~x;
    for (let x = -100; x <= 100; ++x) {
        assertEquals(
            app.apply(app.pure(invert))(app.pure(x)),
            app.pure(invert(x)),
        );
    }

    // interchange
    const f = These.newThat((x: number) => 3 - x);
    for (let x = -100; x <= 100; ++x) {
        assertEquals(
            app.apply(f)(app.pure(x)),
            app.apply(app.pure((fn: (x: number) => number) => fn(x)))(f),
        );
    }
});
Deno.test("foldable functor laws", () => {
    const applied = These.foldable<string>().foldR(
        (next: number) => (acc: number) => next - acc,
    )(0);

    assertEquals(applied(These.newThis("3")), 0);
    assertEquals(applied(These.newThat(-2)), -2);
    assertEquals(applied(These.newBoth("1")(6)), 6);
});
Deno.test("monad laws", () => {
    const m = These.monad(semiGroup);
    const withOctal = (x: number) => These.newBoth(x.toString(8))(x + 1);
    const withHex = (x: number) => These.newBoth(x.toString(16))(x + 1);

    // left identity
    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.flatMap(withOctal)(m.pure(x)), withOctal(x));
    }

    // right identity
    for (
        const t of [
            These.newThis("baz"),
            These.newThat(8),
            These.newBoth("xyz")(11),
        ]
    ) {
        assertEquals(m.flatMap(m.pure)(t), t);
    }

    // associativity
    for (
        const t of [
            These.newThis("baz"),
            These.newThat(8),
            These.newBoth("xyz")(11),
        ]
    ) {
        assertEquals(
            m.flatMap(withOctal)(m.flatMap(withHex)(t)),
            m.flatMap((x: number) => m.flatMap(withOctal)(withHex(x)))(t),
        );
    }
});
Deno.test("bifunctor laws", () => {
    const applied = These.bifunctor.biMap((x: number) => x + 3)((x: string) =>
        x.toUpperCase()
    );

    assertEquals(applied(These.newThis(2)), These.newThis(5));
    assertEquals(applied(These.newThat("foo")), These.newThat("FOO"));
    assertEquals(applied(These.newBoth(3)("bar")), These.newBoth(6)("BAR"));
});

Deno.test("encode then decode", () => {
    for (
        const t of [
            These.newThis("baz"),
            These.newThat(8),
            These.newBoth("xyz")(11),
        ]
    ) {
        const code = These.enc(encUtf8)(encI32Be)(t);
        const serial = runCode(code);
        const decoded = unwrap(
            runDecoder(These.dec(decUtf8())(decI32Be()))(serial),
        );
        assertEquals(decoded, t);
    }
});

import { expect, test } from "vitest";
import * as List from "./list.js";
import * as Number from "./number.js";
import { unwrap } from "./result.js";
import {
    decI32Be,
    decUtf8,
    encI32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.js";
import { semiGroup } from "./string.js";
import * as These from "./these.js";
import * as Tuple from "./tuple.js";
import { nonNanOrd, stringOrd } from "./type-class/ord.js";

test("partial equality", () => {
    const equality = These.partialEq(Number.partialOrd, stringOrd);

    expect(equality.eq(These.newThis(2), These.newThat("2"))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThis(2), These.newBoth(2)("2"))).toStrictEqual(
        false,
    );
    expect(
        equality.eq(These.newThat("2"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(equality.eq(These.newThat("2"), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newBoth(2)("2"), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(
        equality.eq(These.newBoth(2)("2"), These.newThat("2")),
    ).toStrictEqual(false);

    expect(equality.eq(These.newThis(0), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThis(0), These.newThis(0))).toStrictEqual(true);
    expect(equality.eq(These.newThis(2), These.newThis(0))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThis(NaN), These.newThis(NaN))).toStrictEqual(
        false,
    );

    expect(equality.eq(These.newThat("0"), These.newThat("2"))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThat("0"), These.newThat("0"))).toStrictEqual(
        true,
    );
    expect(equality.eq(These.newThat("2"), These.newThat("0"))).toStrictEqual(
        false,
    );

    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("0")),
    ).toStrictEqual(true);
    expect(
        equality.eq(These.newBoth(0)("2"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("2"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("2"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("0")),
    ).toStrictEqual(true);
    expect(
        equality.eq(These.newBoth(2)("2"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
});
test("equality", () => {
    const equality = These.eq(nonNanOrd, stringOrd);

    expect(equality.eq(These.newThis(2), These.newThat("2"))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThis(2), These.newBoth(2)("2"))).toStrictEqual(
        false,
    );
    expect(
        equality.eq(These.newThat("2"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(equality.eq(These.newThat("2"), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newBoth(2)("2"), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(
        equality.eq(These.newBoth(2)("2"), These.newThat("2")),
    ).toStrictEqual(false);

    expect(equality.eq(These.newThis(0), These.newThis(2))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThis(0), These.newThis(0))).toStrictEqual(true);
    expect(equality.eq(These.newThis(2), These.newThis(0))).toStrictEqual(
        false,
    );
    expect(() => {
        equality.eq(These.newThis(NaN), These.newThis(NaN));
    }).toThrowError("NaN detected");

    expect(equality.eq(These.newThat("0"), These.newThat("2"))).toStrictEqual(
        false,
    );
    expect(equality.eq(These.newThat("0"), These.newThat("0"))).toStrictEqual(
        true,
    );
    expect(equality.eq(These.newThat("2"), These.newThat("0"))).toStrictEqual(
        false,
    );

    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(0)("0")),
    ).toStrictEqual(true);
    expect(
        equality.eq(These.newBoth(0)("2"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("0"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(0)("2"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("2"), These.newBoth(0)("0")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("2")),
    ).toStrictEqual(false);
    expect(
        equality.eq(These.newBoth(2)("0"), These.newBoth(2)("0")),
    ).toStrictEqual(true);
    expect(
        equality.eq(These.newBoth(2)("2"), These.newBoth(2)("0")),
    ).toStrictEqual(false);
});

test("type assertion", () => {
    expect(These.isThis(These.newThis("foo"))).toStrictEqual(true);
    expect(These.isThis(These.newThat("foo"))).toStrictEqual(false);
    expect(These.isThis(These.newBoth("foo")("bar"))).toStrictEqual(false);

    expect(These.isThat(These.newThis("foo"))).toStrictEqual(false);
    expect(These.isThat(These.newThat("foo"))).toStrictEqual(true);
    expect(These.isThat(These.newBoth("foo")("bar"))).toStrictEqual(false);

    expect(These.isBoth(These.newThis("foo"))).toStrictEqual(false);
    expect(These.isBoth(These.newThat("foo"))).toStrictEqual(false);
    expect(These.isBoth(These.newBoth("foo")("bar"))).toStrictEqual(true);
});
test("intoTuple", () => {
    const applied = These.intoTuple("foo")(42);

    expect(applied(These.newThis("bar"))).toStrictEqual(["bar", 42]);
    expect(applied(These.newThat(314))).toStrictEqual(["foo", 314]);
    expect(applied(These.newBoth("e")(218))).toStrictEqual(["e", 218]);
});
test("merge", () => {
    const applied = These.merge((x: number) => (y: number) => x + y);

    expect(applied(These.newThis(2))).toStrictEqual(2);
    expect(applied(These.newThat(3))).toStrictEqual(3);
    expect(applied(These.newBoth(2)(3))).toStrictEqual(5);
});
test("mergeWith", () => {
    const applied = These.mergeWith((x: number) => x.toString(16))(
        (x: number) => x.toString(8),
    )((x) => (y) => x + y);

    expect(applied(These.newThis(42))).toStrictEqual("2a");
    expect(applied(These.newThat(24))).toStrictEqual("30");
    expect(applied(These.newBoth(13)(68))).toStrictEqual("d104");
});
test("partition", () => {
    const [thisItems, thatItems, bothItems] = These.partition(
        List.fromIterable([
            These.newThis("foo"),
            These.newThat(63),
            These.newThis("bar"),
            These.newBoth("baz")(82),
            These.newThat(88),
        ]),
    );
    expect(List.toArray(thisItems)).toStrictEqual(["foo", "bar"]);
    expect(List.toArray(thatItems)).toStrictEqual([63, 88]);
    expect(List.toArray(bothItems)).toStrictEqual([["baz", 82]]);
});
test("distributeTheseTuple", () => {
    expect(
        These.distributeTheseTuple(These.newThis(Tuple.make(6)("x"))),
    ).toStrictEqual([These.newThis(6), These.newThis("x")]);
    expect(These.distributeTheseTuple(These.newThat("y"))).toStrictEqual([
        These.newThat("y"),
        These.newThat("y"),
    ]);
    expect(
        These.distributeTheseTuple(These.newBoth(Tuple.make(9)("z"))(10)),
    ).toStrictEqual([These.newBoth(9)(10), These.newBoth("z")(10)]);
});
test("undistributeTheseTuple", () => {
    expect(
        These.undistributeTheseTuple([These.newThis(6), These.newThis("x")]),
    ).toStrictEqual(These.newThis(Tuple.make(6)("x")));
    expect(
        These.undistributeTheseTuple([These.newThat("y"), These.newThat("y")]),
    ).toStrictEqual(These.newThat("y"));
    expect(
        These.undistributeTheseTuple([
            These.newBoth(9)(10),
            These.newBoth("z")(10),
        ]),
    ).toStrictEqual(These.newBoth(Tuple.make(9)("z"))(10));
});
test("distributeTupleThese", () => {
    expect(These.distributeTupleThese([These.newThis(6), 91])).toStrictEqual(
        These.newThis(Tuple.make(6)(91)),
    );
    expect(These.distributeTupleThese([These.newThat("g"), 91])).toStrictEqual(
        These.newThat(Tuple.make("g")(91)),
    );
    expect(
        These.distributeTupleThese([These.newBoth("h")(7), 91]),
    ).toStrictEqual(These.newBoth(Tuple.make("h")(91))(Tuple.make(7)(91)));
});
test("undistributeTupleThese", () => {
    expect(
        These.undistributeTupleThese(These.newThis(Tuple.make(6)(91))),
    ).toStrictEqual([These.newThis(6), 91]);
    expect(
        These.undistributeTupleThese(These.newThat(Tuple.make("g")(91))),
    ).toStrictEqual([These.newThat("g"), 91]);
    expect(
        These.undistributeTupleThese(
            These.newBoth(Tuple.make("h")(91))(Tuple.make(7)(91)),
        ),
    ).toStrictEqual([These.newBoth("h")(7), 91]);
});
test("combine", () => {
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newThis("y"),
        ),
    ).toStrictEqual(These.newThis("xy"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newThat("y"),
        ),
    ).toStrictEqual(These.newBoth("x")("y"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThis("x"),
            These.newBoth("y")("z"),
        ),
    ).toStrictEqual(These.newBoth("xy")("z"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newThis("y"),
        ),
    ).toStrictEqual(These.newBoth("y")("x"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newThat("y"),
        ),
    ).toStrictEqual(These.newThat("xy"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newThat("x"),
            These.newBoth("y")("z"),
        ),
    ).toStrictEqual(These.newBoth("y")("xz"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newThis("z"),
        ),
    ).toStrictEqual(These.newBoth("xz")("y"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newThat("z"),
        ),
    ).toStrictEqual(These.newBoth("x")("yz"));
    expect(
        These.combine(semiGroup, semiGroup)(
            These.newBoth("x")("y"),
            These.newBoth("z")("a"),
        ),
    ).toStrictEqual(These.newBoth("xz")("ya"));
});

test("semi-group laws", () => {
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
                expect(g.combine(x, g.combine(y, z))).toStrictEqual(
                    g.combine(g.combine(x, y), z),
                );
            }
        }
    }
});
test("functor laws", () => {
    const f = These.functor<number>();

    // identity
    for (const t of [
        These.newThis(2),
        These.newThat("foo"),
        These.newBoth(8)("bar"),
    ]) {
        expect(f.map((x: string) => x)(t)).toStrictEqual(t);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (const t of [
        These.newThis(2),
        These.newThat(88),
        These.newBoth(8)(53),
    ]) {
        expect(f.map((x: number) => add3(mul2(x)))(t)).toStrictEqual(
            f.map(add3)(f.map(mul2)(t)),
        );
    }
});
test("applicative functor laws", () => {
    const app = These.app(Number.addAbelianGroup);

    // identity
    for (const t of [
        These.newThis(2),
        These.newThat(88),
        These.newBoth(8)(53),
    ]) {
        expect(app.apply(app.pure((x: number) => x))(t)).toStrictEqual(t);
    }

    // composition
    for (const x of [
        These.newThis(2),
        These.newThat((x: number) => x + 3),
        These.newBoth(8)((x: number) => x + 3),
    ]) {
        for (const y of [
            These.newThis(3),
            These.newThat((x: number) => x * 2),
            These.newBoth(9)((x: number) => x * 2),
        ]) {
            for (const z of [
                These.newThis(4),
                These.newThat(88),
                These.newBoth(10)(53),
            ]) {
                expect(
                    app.apply(
                        app.apply(
                            app.apply(
                                app.pure(
                                    (f: (x: number) => number) =>
                                        (g: (x: number) => number) =>
                                        (x: number) =>
                                            f(g(x)),
                                ),
                            )(x),
                        )(y),
                    )(z),
                ).toStrictEqual(app.apply(x)(app.apply(y)(z)));
            }
        }
    }

    // homomorphism
    const invert = (x: number) => ~x;
    for (let x = -100; x <= 100; ++x) {
        expect(app.apply(app.pure(invert))(app.pure(x))).toStrictEqual(
            app.pure(invert(x)),
        );
    }

    // interchange
    const f = These.newThat((x: number) => 3 - x);
    for (let x = -100; x <= 100; ++x) {
        expect(app.apply(f)(app.pure(x))).toStrictEqual(
            app.apply(app.pure((fn: (x: number) => number) => fn(x)))(f),
        );
    }
});
test("foldable functor laws", () => {
    const applied = These.foldable<string>().foldR(
        (next: number) => (acc: number) => next - acc,
    )(0);

    expect(applied(These.newThis("3"))).toStrictEqual(0);
    expect(applied(These.newThat(-2))).toStrictEqual(-2);
    expect(applied(These.newBoth("1")(6))).toStrictEqual(6);
});
test("monad laws", () => {
    const m = These.monad(semiGroup);
    const withOctal = (x: number) => These.newBoth(x.toString(8))(x + 1);
    const withHex = (x: number) => These.newBoth(x.toString(16))(x + 1);

    // left identity
    for (let x = -100; x <= 100; ++x) {
        expect(m.flatMap(withOctal)(m.pure(x))).toStrictEqual(withOctal(x));
    }

    // right identity
    for (const t of [
        These.newThis("baz"),
        These.newThat(8),
        These.newBoth("xyz")(11),
    ]) {
        expect(m.flatMap(m.pure)(t)).toStrictEqual(t);
    }

    // associativity
    for (const t of [
        These.newThis("baz"),
        These.newThat(8),
        These.newBoth("xyz")(11),
    ]) {
        expect(m.flatMap(withOctal)(m.flatMap(withHex)(t))).toStrictEqual(
            m.flatMap((x: number) => m.flatMap(withOctal)(withHex(x)))(t),
        );
    }
});
test("bifunctor laws", () => {
    const applied = These.bifunctor.biMap((x: number) => x + 3)((x: string) =>
        x.toUpperCase(),
    );

    expect(applied(These.newThis(2))).toStrictEqual(These.newThis(5));
    expect(applied(These.newThat("foo"))).toStrictEqual(These.newThat("FOO"));
    expect(applied(These.newBoth(3)("bar"))).toStrictEqual(
        These.newBoth(6)("BAR"),
    );
});

test("encode then decode", () => {
    for (const t of [
        These.newThis("baz"),
        These.newThat(8),
        These.newBoth("xyz")(11),
    ]) {
        const code = These.enc(encUtf8)(encI32Be)(t);
        const serial = runCode(code);
        const decoded = unwrap(
            runDecoder(These.dec(decUtf8())(decI32Be()))(serial),
        );
        expect(decoded).toStrictEqual(t);
    }
});

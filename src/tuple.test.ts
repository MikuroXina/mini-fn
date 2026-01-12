import { expect, test } from "vitest";
import { Array, Lazy, Number, Option, Tuple } from "../mod.js";
import { compose, id } from "./func.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { unwrap } from "./result.js";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.js";
import { stringEq } from "./type-class/eq.js";
import { maxMonoid } from "./type-class/monoid.js";
import { nonNanOrd, stringOrd } from "./type-class/ord.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

test("partial equality", () => {
    const equality = Tuple.partialEq({
        equalityA: stringEq,
        equalityB: Number.partialOrd,
    });
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("bar")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(3)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(4), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);

    expect(
        equality.eq(Tuple.make("foo")(NaN), Tuple.make("foo")(NaN)),
    ).toStrictEqual(false);

    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(3)),
    ).toStrictEqual(true);
});
test("equality", () => {
    const equality = Tuple.eq({
        equalityA: stringEq,
        equalityB: nonNanOrd,
    });
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("bar")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(3)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(4), Tuple.make("bar")(4)),
    ).toStrictEqual(false);
    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
    ).toStrictEqual(false);

    expect(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(3)),
    ).toStrictEqual(true);
});
test("partial order", () => {
    const order = Tuple.partialOrd({
        ordA: nonNanOrd,
        ordB: Number.partialOrd,
    });

    expect(
        order.partialCmp(Tuple.make(5)(NaN), Tuple.make(5)(NaN)),
    ).toStrictEqual(Option.none());
    expect(
        order.partialCmp(Tuple.make(5)(NaN), Tuple.make(6)(NaN)),
    ).toStrictEqual(Option.none());
    expect(
        order.partialCmp(Tuple.make(6)(NaN), Tuple.make(6)(NaN)),
    ).toStrictEqual(Option.none());

    expect(order.partialCmp(Tuple.make(5)(4), Tuple.make(5)(4))).toStrictEqual(
        Option.some(equal as Ordering),
    );
    expect(order.partialCmp(Tuple.make(5)(4), Tuple.make(5)(5))).toStrictEqual(
        Option.some(less as Ordering),
    );
    expect(order.partialCmp(Tuple.make(5)(5), Tuple.make(5)(4))).toStrictEqual(
        Option.some(greater as Ordering),
    );
});
test("total order", () => {
    const order = Tuple.ord({
        ordA: stringOrd,
        ordB: nonNanOrd,
    });

    expect(order.cmp(Tuple.make("a")(64), Tuple.make("a")(64))).toStrictEqual(
        equal,
    );
    expect(order.cmp(Tuple.make("a")(64), Tuple.make("abc")(64))).toStrictEqual(
        less,
    );
    expect(order.cmp(Tuple.make("abc")(64), Tuple.make("a")(64))).toStrictEqual(
        greater,
    );
    expect(order.cmp(Tuple.make("a")(64), Tuple.make("a")(65))).toStrictEqual(
        less,
    );
    expect(order.cmp(Tuple.make("a")(65), Tuple.make("a")(64))).toStrictEqual(
        greater,
    );
});

test("first", () => {
    expect(Tuple.first(Tuple.make(1)("4"))).toStrictEqual(1);
    expect(Tuple.first(Tuple.make("4")(1))).toStrictEqual("4");
});
test("second", () => {
    expect(Tuple.second(Tuple.make(1)("4"))).toStrictEqual("4");
    expect(Tuple.second(Tuple.make("4")(1))).toStrictEqual(1);
});
test("assocL", () => {
    expect(Tuple.assocL(Tuple.make(1)(Tuple.make(2)(3)))).toStrictEqual(
        Tuple.make(Tuple.make(1)(2))(3),
    );
});
test("assocR", () => {
    expect(Tuple.assocR(Tuple.make(Tuple.make(1)(2))(3))).toStrictEqual(
        Tuple.make(1)(Tuple.make(2)(3)),
    );
});
test("curry", () => {
    const product = ([a, b]: Tuple.Tuple<number, number>): number => a * b;
    const curried = Tuple.curry(product);
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            expect(curried(x)(y)).toStrictEqual(product([x, y]));
        }
    }
});
test("uncurry", () => {
    const product =
        (a: number) =>
        (b: number): number =>
            a * b;
    const uncurried = Tuple.uncurry(product);
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            expect(uncurried([x, y])).toStrictEqual(product(x)(y));
        }
    }
});
test("swap", () => {
    expect(Tuple.swap(Tuple.make(1)("4"))).toStrictEqual(Tuple.make("4")(1));
});
test("bind", () => {
    expect(
        Tuple.bind({
            combine: (l: number, r: number) => l + r,
            [semiGroupSymbol]: true,
        })(Tuple.make(4)(5))((x: number) => Tuple.make(x + 1)("y")),
    ).toStrictEqual(Tuple.make(10)("y"));
});
test("defer", () => {
    const unzipped = Tuple.defer(Lazy.known(Tuple.make(4)(2)));
    expect(Lazy.force(unzipped[0])).toStrictEqual(4);
    expect(Lazy.force(unzipped[1])).toStrictEqual(2);
});
test("foldR", () => {
    expect(
        Tuple.foldR((x: number) => (y: number) => x ^ y)(1)(Tuple.make(2)(4)),
    ).toStrictEqual(7);
});
test("bifoldR", () => {
    expect(
        Tuple.bifoldable.bifoldR(
            (a: number) => (c: string) => a.toString() + c,
        )((b: boolean) => (c: string) => b.toString() + c)("")([5, false]),
    ).toStrictEqual("5false");
});
test("bitraverse", () => {
    expect(
        Tuple.bitraversable.bitraverse(Array.applicative)((x: string) => [
            "ERROR",
            x,
        ])((x: number) => [x, x + 1])(Tuple.make("")(2)),
    ).toStrictEqual([
        Tuple.make("ERROR")(2),
        Tuple.make("ERROR")(3),
        Tuple.make("")(2),
        Tuple.make("")(3),
    ]);
});

test("functor laws", () => {
    const f = Tuple.functor<number>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(f.map((x: number) => x)(t)).toStrictEqual(t);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(f.map((x: number) => add3(mul2(x)))(t)).toStrictEqual(
                f.map(add3)(f.map(mul2)(t)),
            );
        }
    }
});
test("applicative functor laws", () => {
    const app = Tuple.applicative<number>(maxMonoid(-Infinity));
    const mul2 = app.pure((x: number) => x * 2);
    const add3 = app.pure((x: number) => x + 3);

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(app.apply(app.pure((i: number) => i))(t)).toStrictEqual(t);
        }
    }

    // composition
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(
                app.apply(
                    app.apply(
                        app.apply(
                            app.pure(
                                (f: (x: number) => number) =>
                                    (g: (x: number) => number) =>
                                    (i: number) =>
                                        f(g(i)),
                            ),
                        )(add3),
                    )(mul2),
                )(t),
            ).toStrictEqual(app.apply(add3)(app.apply(mul2)(t)));
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(app.apply(app.pure(Tuple.swap))(app.pure(t))).toStrictEqual(
                app.pure(Tuple.swap(t)),
            );
        }
    }

    // interchange
    for (let x = -100; x <= 100; ++x) {
        expect(app.apply(add3)(app.pure(x))).toStrictEqual(
            app.apply(app.pure((i: (x: number) => number) => i(x)))(add3),
        );
    }
});
test("monad laws", () => {
    const m = Tuple.monad<number>(maxMonoid(-Infinity));

    const halfDouble = (x: number): Tuple.Tuple<number, number> => [
        x / 2,
        x * 2,
    ];
    const minusPlus = (x: number): Tuple.Tuple<number, number> => [
        x - 1,
        x + 1,
    ];

    // left identity
    for (let x = -100; x <= 100; ++x) {
        expect(m.flatMap(halfDouble)(m.pure(x))).toStrictEqual(halfDouble(x));
    }

    // right identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(m.flatMap(m.pure)(t)).toStrictEqual(t);
        }
    }

    // associativity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(
                m.flatMap(halfDouble)(m.flatMap(minusPlus)(t)),
            ).toStrictEqual(
                m.flatMap((x: number) => m.flatMap(halfDouble)(minusPlus(x)))(
                    t,
                ),
            );
        }
    }
});
test("bifunctor laws", () => {
    const f = Tuple.bifunctor;

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(f.biMap(id)(id)(t)).toStrictEqual(t);
        }
    }

    // composition
    const succ = (x: number) => x + 1;
    const invert = (x: number) => ~x;
    const mul4 = (x: number) => x * 4;
    const square = (x: number) => x ** 2;
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            expect(
                f.biMap(compose(succ)(invert))(compose(mul4)(square))(t),
            ).toStrictEqual(
                compose(f.biMap(succ)(mul4))(f.biMap(invert)(square))(t),
            );
        }
    }
});
test("comonad laws", () => {
    const c = Tuple.comonad<number>();

    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            // duplicate then extract
            expect(c.extract(c.duplicate(t))).toStrictEqual(t);

            // extract as identity of map
            expect(c.map(c.extract)(c.duplicate(t))).toStrictEqual(t);

            // duplicate as identity of map
            expect(c.duplicate(c.duplicate(t))).toStrictEqual(
                c.map(c.duplicate)(c.duplicate(t)),
            );
        }
    }
});

test("encode then decode", () => {
    const data = Tuple.make(1024)("wow");
    const serial = runCode(Tuple.enc(encU32Be)(encUtf8)(data));
    expect(
        unwrap(runDecoder(Tuple.dec(decU32Be())(decUtf8()))(serial)),
    ).toStrictEqual(data);
});

import { assertEquals } from "../deps.ts";
import { Array, Lazy, Number, Option, Tuple } from "../mod.ts";
import { compose, id } from "./func.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { unwrap } from "./result.ts";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.ts";
import { stringEq } from "./type-class/eq.ts";
import { maxMonoid } from "./type-class/monoid.ts";
import { stringOrd } from "./type-class/ord.ts";
import { nonNanOrd } from "./type-class/ord.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

Deno.test("partial equality", () => {
    const equality = Tuple.partialEq({
        equalityA: stringEq,
        equalityB: Number.partialOrd,
    });
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("bar")(3), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(3)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(4), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
        false,
    );

    assertEquals(
        equality.eq(Tuple.make("foo")(NaN), Tuple.make("foo")(NaN)),
        false,
    );

    assertEquals(equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(3)), true);
});
Deno.test("equality", () => {
    const equality = Tuple.eq({
        equalityA: stringEq,
        equalityB: nonNanOrd,
    });
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("bar")(3), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(3)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(4), Tuple.make("bar")(4)),
        false,
    );
    assertEquals(
        equality.eq(Tuple.make("foo")(3), Tuple.make("bar")(4)),
        false,
    );

    assertEquals(equality.eq(Tuple.make("foo")(3), Tuple.make("foo")(3)), true);
});
Deno.test("partial order", () => {
    const order = Tuple.partialOrd({
        ordA: nonNanOrd,
        ordB: Number.partialOrd,
    });

    assertEquals(
        order.partialCmp(
            Tuple.make(5)(NaN),
            Tuple.make(5)(NaN),
        ),
        Option.none(),
    );
    assertEquals(
        order.partialCmp(
            Tuple.make(5)(NaN),
            Tuple.make(6)(NaN),
        ),
        Option.none(),
    );
    assertEquals(
        order.partialCmp(
            Tuple.make(6)(NaN),
            Tuple.make(6)(NaN),
        ),
        Option.none(),
    );

    assertEquals(
        order.partialCmp(
            Tuple.make(5)(4),
            Tuple.make(5)(4),
        ),
        Option.some(equal as Ordering),
    );
    assertEquals(
        order.partialCmp(
            Tuple.make(5)(4),
            Tuple.make(5)(5),
        ),
        Option.some(less as Ordering),
    );
    assertEquals(
        order.partialCmp(
            Tuple.make(5)(5),
            Tuple.make(5)(4),
        ),
        Option.some(greater as Ordering),
    );
});
Deno.test("total order", () => {
    const order = Tuple.ord({
        ordA: stringOrd,
        ordB: nonNanOrd,
    });

    assertEquals(order.cmp(Tuple.make("a")(64), Tuple.make("a")(64)), equal);
    assertEquals(order.cmp(Tuple.make("a")(64), Tuple.make("abc")(64)), less);
    assertEquals(
        order.cmp(Tuple.make("abc")(64), Tuple.make("a")(64)),
        greater,
    );
    assertEquals(order.cmp(Tuple.make("a")(64), Tuple.make("a")(65)), less);
    assertEquals(order.cmp(Tuple.make("a")(65), Tuple.make("a")(64)), greater);
});

Deno.test("first", () => {
    assertEquals(Tuple.first(Tuple.make(1)("4")), 1);
    assertEquals(Tuple.first(Tuple.make("4")(1)), "4");
});
Deno.test("second", () => {
    assertEquals(Tuple.second(Tuple.make(1)("4")), "4");
    assertEquals(Tuple.second(Tuple.make("4")(1)), 1);
});
Deno.test("assocL", () => {
    assertEquals(
        Tuple.assocL(Tuple.make(1)(Tuple.make(2)(3))),
        Tuple.make(Tuple.make(1)(2))(3),
    );
});
Deno.test("assocR", () => {
    assertEquals(
        Tuple.assocR(Tuple.make(Tuple.make(1)(2))(3)),
        Tuple.make(1)(Tuple.make(2)(3)),
    );
});
Deno.test("curry", () => {
    const product = ([a, b]: Tuple.Tuple<number, number>): number => a * b;
    const curried = Tuple.curry(product);
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            assertEquals(curried(x)(y), product([x, y]));
        }
    }
});
Deno.test("uncurry", () => {
    const product = (a: number) => (b: number): number => a * b;
    const uncurried = Tuple.uncurry(product);
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            assertEquals(uncurried([x, y]), product(x)(y));
        }
    }
});
Deno.test("swap", () => {
    assertEquals(Tuple.swap(Tuple.make(1)("4")), Tuple.make("4")(1));
});
Deno.test("bind", () => {
    assertEquals(
        Tuple.bind({
            combine: (l: number, r: number) => l + r,
            [semiGroupSymbol]: true,
        })(Tuple.make(4)(5))((x: number) => Tuple.make(x + 1)("y")),
        Tuple.make(10)("y"),
    );
});
Deno.test("defer", () => {
    const unzipped = Tuple.defer(Lazy.known(Tuple.make(4)(2)));
    assertEquals(Lazy.force(unzipped[0]), 4);
    assertEquals(Lazy.force(unzipped[1]), 2);
});
Deno.test("foldR", () => {
    assertEquals(
        Tuple.foldR((x: number) => (y: number) => x ^ y)(1)(Tuple.make(2)(4)),
        7,
    );
});
Deno.test("bifoldR", () => {
    assertEquals(
        Tuple.bifoldable.bifoldR((a: number) => (c: string) =>
            a.toString() + c
        )((b: boolean) => (c: string) => b.toString() + c)("")([5, false]),
        "5false",
    );
});
Deno.test("bitraverse", () => {
    assertEquals(
        Tuple.bitraversable.bitraverse(Array.applicative)((
            x: string,
        ) => ["ERROR", x])((x: number) => [x, x + 1])(Tuple.make("")(2)),
        [
            Tuple.make("ERROR")(2),
            Tuple.make("ERROR")(3),
            Tuple.make("")(2),
            Tuple.make("")(3),
        ],
    );
});

Deno.test("functor laws", () => {
    const f = Tuple.functor<number>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(f.map((x: number) => x)(t), t);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(
                f.map((x: number) => add3(mul2(x)))(t),
                f.map(add3)(f.map(mul2)(t)),
            );
        }
    }
});
Deno.test("applicative functor laws", () => {
    const app = Tuple.applicative<number>(maxMonoid(-Infinity));
    const mul2 = app.pure((x: number) => x * 2);
    const add3 = app.pure((x: number) => x + 3);

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(app.apply(app.pure((i: number) => i))(t), t);
        }
    }

    // composition
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            app.apply(
                app.apply(
                    app.apply(app.pure(
                        (f: (x: number) => number) =>
                        (g: (x: number) => number) =>
                        (i: number) => f(g(i)),
                    ))(add3),
                )(mul2),
            )(t), app.apply(add3)(app.apply(mul2)(t));
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(
                app.apply(app.pure(Tuple.swap))(app.pure(t)),
                app.pure(Tuple.swap(t)),
            );
        }
    }

    // interchange
    for (let x = -100; x <= 100; ++x) {
        assertEquals(
            app.apply(add3)(app.pure(x)),
            app.apply(app.pure((i: (x: number) => number) => i(x)))(add3),
        );
    }
});
Deno.test("monad laws", () => {
    const m = Tuple.monad<number>(maxMonoid(-Infinity));

    const halfDouble = (
        x: number,
    ): Tuple.Tuple<number, number> => [x / 2, x * 2];
    const minusPlus = (
        x: number,
    ): Tuple.Tuple<number, number> => [x - 1, x + 1];

    // left identity
    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.flatMap(halfDouble)(m.pure(x)), halfDouble(x));
    }

    // right identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(m.flatMap(m.pure)(t), t);
        }
    }

    // associativity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(
                m.flatMap(halfDouble)(m.flatMap(minusPlus)(t)),
                m.flatMap((x: number) => m.flatMap(halfDouble)(minusPlus(x)))(
                    t,
                ),
            );
        }
    }
});
Deno.test("bifunctor laws", () => {
    const f = Tuple.bifunctor;

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            assertEquals(f.biMap(id)(id)(t), t);
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
            assertEquals(
                f.biMap(compose(succ)(invert))(compose(mul4)(square))(t),
                compose(f.biMap(succ)(mul4))(f.biMap(invert)(square))(t),
            );
        }
    }
});
Deno.test("comonad laws", () => {
    const c = Tuple.comonad<number>();

    for (let x = -100; x <= 100; ++x) {
        for (let y = -100; y <= 100; ++y) {
            const t = Tuple.make(x)(y);
            // duplicate then extract
            assertEquals(c.extract(c.duplicate(t)), t);

            // extract as identity of map
            assertEquals(c.map(c.extract)(c.duplicate(t)), t);

            // duplicate as identity of map
            assertEquals(
                c.duplicate(c.duplicate(t)),
                c.map(c.duplicate)(c.duplicate(t)),
            );
        }
    }
});

Deno.test("encode then decode", () => {
    const data = Tuple.make(1024)("wow");
    const serial = runCode(Tuple.enc(encU32Be)(encUtf8)(data));
    assertEquals(
        unwrap(runDecoder(Tuple.dec(decU32Be())(decUtf8()))(serial)),
        data,
    );
});

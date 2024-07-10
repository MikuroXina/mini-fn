import {
    abelianGroup,
    applicative,
    compose,
    type Fn,
    fnArrow,
    functor,
    group,
    id,
    liftBinary,
    monad,
    split,
    until,
} from "./func.ts";
import { addAbelianGroup } from "./number.ts";
import { assertEquals } from "../deps.ts";
import * as Tuple from "./tuple.ts";

Deno.test("group", () => {
    for (const make of [group, abelianGroup]) {
        const groupForFn = make<void, number>(addAbelianGroup);
        assertEquals(groupForFn.identity(), 0);
        assertEquals(
            groupForFn.combine(
                () => 1,
                () => 2,
            )(),
            3,
        );
        assertEquals(groupForFn.invert(() => 1)(), -1);
    }
});

Deno.test("until", () => {
    const padLeft = until((x: string) => 4 <= x.length)((x) => "0" + x);

    assertEquals(padLeft(""), "0000");
    assertEquals(padLeft("1"), "0001");
    assertEquals(padLeft("13"), "0013");
    assertEquals(padLeft("131"), "0131");
    assertEquals(padLeft("1316"), "1316");
    assertEquals(padLeft("1316534"), "1316534");
});

Deno.test("liftBinary", () => {
    const cmp = liftBinary<number>()((a: string) => (b: string) => a === b);
    for (let i = 0; i < 10; ++i) {
        assertEquals(
            cmp((x: number) => x.toString())((x: number) => x.toString(10))(i),
            true,
        );
    }
});

const assertFnEquality = <T>(
    left: Fn<number, T>,
    right: Fn<number, T>,
) => {
    for (let i = -100; i <= 100; ++i) {
        assertEquals(left(i), right(i));
    }
};

Deno.test("functor laws", () => {
    const f = functor<number>();

    const fn = (x: number) => x.toString();
    // identity
    const mapped = f.map((x: string) => x)(fn);
    assertFnEquality(mapped, fn);

    // composition
    const toStr = (x: number) => x.toString();
    const parse = (x: string) => parseInt(x, 10);
    const left = f.map((x: number) => parse(toStr(x)))((x) => x);
    const right = f.map(parse)(f.map(toStr)((x) => x));
    assertFnEquality(left, right);
});

Deno.test("applicative functor laws", () => {
    const app = applicative<number>();

    // identity
    const toStr = (x: number) => x.toString();
    const applied = app.apply(app.pure((x: string) => x))(
        toStr,
    );
    assertFnEquality(toStr, applied);

    // composition
    const addAndToStr = (a: number) => (b: number): string =>
        (a + b).toString();
    const addLength = (a: number) => (b: string): number => a + b.length;
    const composedLeft = app.apply(
        app.apply(
            app.apply(
                app.pure(
                    (f: Fn<number, string>) =>
                    (g: Fn<string, number>) =>
                    (i: string) => f(g(i)),
                ),
            )(addAndToStr),
        )(addLength),
    )(toStr);
    const composedRight = app.apply(addAndToStr)(app.apply(addLength)(toStr));
    assertFnEquality(composedLeft, composedRight);

    // homomorphism
    for (let x = -10; x <= 10; ++x) {
        assertFnEquality(
            app.apply(app.pure(toStr))(app.pure(x)),
            app.pure(toStr(x)),
        );
    }

    // interchange
    const sub = (x: number) => (y: number) => x - y;
    for (let x = -10; x <= 10; ++x) {
        assertFnEquality(
            app.apply(sub)(app.pure(x)),
            app.apply(app.pure((i: Fn<number, number>) => i(x)))(sub),
        );
    }
});

Deno.test("monad laws", () => {
    const m = monad<number>();

    // left identity
    const toHexStr = (head: string) => (a: number) => head + a.toString(16);
    const hexHead = "0x";
    assertFnEquality(m.flatMap(toHexStr)(m.pure(hexHead)), toHexStr(hexHead));

    // right identity
    const invert = (a: number) => ~a;
    assertFnEquality(m.flatMap(m.pure)(invert), invert);

    // associativity
    const withUnit = (unit: string) => (a: number) => `${a} [${unit}]`;
    const toStr = (x: number) => x.toString();
    assertFnEquality(
        m.flatMap(withUnit)(m.flatMap(toHexStr)(toStr)),
        m.flatMap((x: string) => m.flatMap(withUnit)(toHexStr(x)))(toStr),
    );
});

const assertSplitFnEquality = <T, U>(
    left: Fn<Tuple.Tuple<number, number>, Tuple.Tuple<T, U>>,
    right: Fn<Tuple.Tuple<number, number>, Tuple.Tuple<T, U>>,
) => {
    for (let i = -100; i <= 100; ++i) {
        for (let j = -100; j <= 100; ++j) {
            const param = [
                i,
                j,
            ] as const;
            assertEquals(
                left(param),
                right(param),
            );
        }
    }
};

Deno.test("arrow laws", () => {
    // identity arrow
    assertFnEquality(fnArrow.arr(id<number>), fnArrow.identity<number>());

    // composition arrow
    const mul3 = (x: number) => x * 3;
    const add5 = (x: number) => x + 5;
    assertFnEquality(
        fnArrow.arr(compose(mul3)(add5)),
        fnArrow.compose(fnArrow.arr(mul3))(fnArrow.arr(add5)),
    );

    // left interchange
    const toStr = (x: number) => x.toString();
    assertSplitFnEquality(
        fnArrow.split(fnArrow.arr(toStr))(fnArrow.identity()),
        fnArrow.arr(fnArrow.split(toStr)(fnArrow.identity())),
    );

    // left composition
    const parse = (x: string) => parseInt(x, 10);
    assertSplitFnEquality(
        fnArrow.split(compose(parse)(toStr))(fnArrow.identity()),
        fnArrow.compose(fnArrow.split(parse)(fnArrow.identity<number>()))(
            fnArrow.split(toStr)(fnArrow.identity()),
        ),
    );

    // extracting first interchange
    {
        const left = fnArrow.compose(
            fnArrow.arr(Tuple.first<number, string>),
        )(fnArrow.split(mul3)(fnArrow.identity()));
        const right = fnArrow.compose(mul3)(
            fnArrow.arr(Tuple.first<number, string>),
        );
        for (let first = -100; first <= 100; ++first) {
            const second = "foo";
            assertEquals(left([first, second]), right([first, second]));
        }
    }

    // independence
    {
        const left = fnArrow.compose(
            fnArrow.arr(
                split(id<number>)(add5),
            ),
        )(split(mul3)(fnArrow.identity()));
        const right = fnArrow.compose(
            fnArrow.split(mul3)(fnArrow.identity()),
        )(fnArrow.arr(split(id<number>)(add5)));
        for (let first = -100; first <= 100; ++first) {
            for (let second = -100; second <= 100; ++second) {
                assertEquals(left([first, second]), right([first, second]));
            }
        }
    }

    // idempotence
    {
        const left = fnArrow.compose(
            fnArrow.arr(Tuple.assocR<number, number, number>),
        )(
            fnArrow.split(
                fnArrow.split(mul3)(fnArrow.identity<number>()),
            )(fnArrow.identity()),
        );
        const right = fnArrow.compose(
            fnArrow.split(mul3)(
                fnArrow.identity<Tuple.Tuple<number, number>>(),
            ),
        )(fnArrow.arr(Tuple.assocR<number, number, number>));
        for (let first = -25; first <= 25; ++first) {
            for (let second = -25; second <= 25; ++second) {
                for (let third = -25; third <= 25; ++third) {
                    assertEquals(
                        left([[first, second], third]),
                        right([[first, second], third]),
                    );
                }
            }
        }
    }
});

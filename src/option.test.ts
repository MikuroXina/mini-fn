import { assertEquals } from "../deps.ts";
import { Array, Compose, Identity, Result } from "../mod.ts";
import * as Option from "./option.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.ts";
import { stringEq } from "./type-class/eq.ts";
import { stringOrd } from "./type-class/ord.ts";

Deno.test("partial equality", () => {
    assertEquals(
        Option.partialEquality(stringEq)(Option.none(), Option.none()),
        true,
    );
    assertEquals(
        Option.partialEquality(stringEq)(Option.some("xxx"), Option.none()),
        false,
    );
    assertEquals(
        Option.partialEquality(stringEq)(Option.none(), Option.some("xxx")),
        false,
    );
    assertEquals(
        Option.partialEquality(stringEq)(
            Option.some("xxx"),
            Option.some("xxy"),
        ),
        false,
    );
    assertEquals(
        Option.partialEquality(stringEq)(
            Option.some("xxx"),
            Option.some("xxx"),
        ),
        true,
    );
});

Deno.test("partial order", () => {
    const optionStrCmp = Option.partialCmp(stringOrd);
    assertEquals(
        optionStrCmp(Option.none(), Option.none()),
        Option.some<Ordering>(equal),
    );
    assertEquals(
        optionStrCmp(Option.none(), Option.some("abc")),
        Option.some<Ordering>(less),
    );
    assertEquals(
        optionStrCmp(Option.some("abc"), Option.none()),
        Option.some<Ordering>(greater),
    );
    assertEquals(
        optionStrCmp(Option.some("abc"), Option.some("xyz")),
        Option.some<Ordering>(less),
    );
    assertEquals(
        optionStrCmp(Option.some("xyz"), Option.some("abc")),
        Option.some<Ordering>(greater),
    );
    assertEquals(
        optionStrCmp(Option.some("xyz"), Option.some("xyz")),
        Option.some<Ordering>(equal),
    );
});

Deno.test("total order", () => {
    const optionStrCmp = Option.cmp(stringOrd);
    assertEquals(
        optionStrCmp(Option.none(), Option.none()),
        equal,
    );
    assertEquals(
        optionStrCmp(Option.none(), Option.some("abc")),
        less,
    );
    assertEquals(
        optionStrCmp(Option.some("abc"), Option.none()),
        greater,
    );
    assertEquals(
        optionStrCmp(Option.some("abc"), Option.some("xyz")),
        less,
    );
    assertEquals(
        optionStrCmp(Option.some("xyz"), Option.some("abc")),
        greater,
    );
    assertEquals(
        optionStrCmp(Option.some("xyz"), Option.some("xyz")),
        equal,
    );
});

Deno.test("toString", () => {
    assertEquals(Option.toString(Option.some(4)), "some(4)");
    assertEquals(Option.toString(Option.none()), "none");
});

Deno.test("flatten", () => {
    assertEquals(Option.flatten(Option.some(Option.some(4))), Option.some(4));
    assertEquals(Option.flatten(Option.some(Option.none())), Option.none());
    assertEquals(Option.flatten(Option.none()), Option.none());
});

Deno.test("and", () => {
    assertEquals(Option.and(Option.none())(Option.none()), Option.none());
    assertEquals(Option.and(Option.none())(Option.some(2)), Option.none());
    assertEquals(Option.and(Option.some("foo"))(Option.none()), Option.none());
    assertEquals(
        Option.and(Option.some("foo"))(Option.some(2)),
        Option.some("foo"),
    );
});

Deno.test("andThen", () => {
    const sqrtThenToString = (num: number): Option.Option<string> =>
        0 <= num ? Option.some(Math.sqrt(num).toString()) : Option.none();

    const applied = Option.andThen(sqrtThenToString);
    assertEquals(applied(Option.some(4)), Option.some("2"));
    assertEquals(applied(Option.some(-1)), Option.none());
    assertEquals(applied(Option.none()), Option.none());
});

Deno.test("or", () => {
    assertEquals(Option.or(Option.none())(Option.none()), Option.none());
    assertEquals(Option.or(Option.none())(Option.some(2)), Option.some(2));
    assertEquals(Option.or(Option.some(100))(Option.none()), Option.some(100));
    assertEquals(Option.or(Option.some(100))(Option.some(2)), Option.some(2));
});

Deno.test("orElse", () => {
    const nobody = Option.orElse((): Option.Option<string> => Option.none());
    const vikings = Option.orElse((): Option.Option<string> =>
        Option.some("vikings")
    );

    assertEquals(vikings(Option.some("barbarians")), Option.some("barbarians"));
    assertEquals(vikings(Option.none()), Option.some("vikings"));
    assertEquals(nobody(Option.none()), Option.none());
});

Deno.test("xor", () => {
    assertEquals(Option.xor(Option.none())(Option.none()), Option.none());
    assertEquals(Option.xor(Option.none())(Option.some(2)), Option.some(2));
    assertEquals(Option.xor(Option.some(100))(Option.none()), Option.some(100));
    assertEquals(Option.xor(Option.some(100))(Option.some(2)), Option.none());
});

Deno.test("isSomeAnd", () => {
    assertEquals(Option.isSomeAnd((x: number) => x >= 2)(Option.some(2)), true);
    assertEquals(
        Option.isSomeAnd((x: number) => x >= 2)(Option.some(1.9)),
        false,
    );
    assertEquals(Option.isSomeAnd((x: number) => x >= 2)(Option.none()), false);
});

Deno.test("isNoneOr", () => {
    assertEquals(Option.isNoneOr((x: number) => x >= 2)(Option.some(2)), true);
    assertEquals(
        Option.isNoneOr((x: number) => x >= 2)(Option.some(1.9)),
        false,
    );
    assertEquals(Option.isNoneOr((x: number) => x >= 2)(Option.none()), true);
});

Deno.test("filter", () => {
    const isEven = Option.filter((x: number) => x % 2 === 0);
    assertEquals(isEven(Option.none()), Option.none());
    assertEquals(isEven(Option.some(3)), Option.none());
    assertEquals(isEven(Option.some(4)), Option.some(4));
});

Deno.test("unzip", () => {
    assertEquals(Option.unzip(Option.some([1, "hi"])), [
        Option.some(1),
        Option.some("hi"),
    ]);
    assertEquals(Option.unzip(Option.none()), [
        Option.none(),
        Option.none(),
    ]);
});

Deno.test("zipWith", () => {
    interface Point {
        x: number;
        y: number;
    }
    const newPoint = Option.zipWith((x: number, y: number): Point => ({
        x,
        y,
    }));
    assertEquals(
        newPoint(Option.some(17.5))(Option.some(42.7)),
        Option.some({ x: 17.5, y: 42.7 }),
    );
    assertEquals(newPoint(Option.none())(Option.none()), Option.none());
});

Deno.test("unwrapOr", () => {
    const unwrapOrBike = Option.unwrapOr("bike");
    assertEquals(unwrapOrBike(Option.some("car")), "car");
    assertEquals(unwrapOrBike(Option.none()), "bike");
});

Deno.test("unwrapOrElse", () => {
    const unwrapOrCalc = Option.unwrapOrElse(() => 6 ** 4);
    assertEquals(unwrapOrCalc(Option.some(4)), 4);
    assertEquals(unwrapOrCalc(Option.none()), 1296);
});

Deno.test("contains", () => {
    const hasTwo = Option.contains(2);
    assertEquals(hasTwo(Option.some(2)), true);
    assertEquals(hasTwo(Option.some(3)), false);
    assertEquals(hasTwo(Option.none()), false);
});

Deno.test("transpose", () => {
    assertEquals(
        Option.optResToResOpt(Option.some(Result.ok(5))),
        Result.ok(Option.some(5)),
    );
    assertEquals(
        Option.optResToResOpt(Option.none()),
        Result.ok(Option.none()),
    );
    assertEquals(
        Option.optResToResOpt(Option.some(Result.err(5))),
        Result.err(5),
    );
});

Deno.test("okOr", () => {
    const orZero = Option.okOr(0);
    assertEquals(orZero(Option.some("foo")), Result.ok("foo"));
    assertEquals(orZero(Option.none()), Result.err(0));
});

Deno.test("okOrElse", () => {
    const orZero = Option.okOrElse(() => 0);
    assertEquals(orZero(Option.some("foo")), Result.ok("foo"));
    assertEquals(orZero(Option.none()), Result.err(0));
});

Deno.test("foldR", () => {
    const applied = Option.foldR((next: number) => (acc: number) => next + acc)(
        1,
    );

    assertEquals(applied(Option.some(2)), 3);
    assertEquals(applied(Option.some(5)), 6);
    assertEquals(applied(Option.none()), 1);
});

Deno.test("traversable functor", () => {
    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option.Option<T> => 0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    for (const data of [Option.some("fever"), Option.none()]) {
        assertEquals(
            first(Option.traversable.traverse(Array.applicative)(dup)(data)),
            Option.traversable.traverse(Option.applicative)((item: string) =>
                first(dup(item))
            )(
                data,
            ),
        );
    }

    // identity
    const num = Option.some(5);
    assertEquals(
        Option.traversable.traverse(Identity.applicative)((a: number) => a)(
            num,
        ),
        num,
    );

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [Option.some("nice"), Option.none()]) {
        assertEquals(
            Option.traversable.traverse(app)((item: string) =>
                Array.map(firstCh)(dup(item))
            )(x),
            Array.map(Option.traversable.traverse(Option.applicative)(firstCh))(
                Option.traversable.traverse(Array.applicative)(dup)(x),
            ),
        );
    }
});

Deno.test("monoid", () => {
    const m = Option.monoid<number>();

    // associative
    {
        const x = Option.some(4);
        const y = Option.some(3);
        const z = Option.some(8);
        assertEquals(
            m.combine(m.combine(x, y), z),
            m.combine(x, m.combine(y, z)),
        );
    }

    // identity
    {
        const x = Option.some(4);
        assertEquals(m.combine(x, m.identity), x);
        assertEquals(m.combine(m.identity, x), x);
    }
});

Deno.test("encode then decode", async () => {
    for (const data of [Option.some(4), Option.none()]) {
        const code = await runCode(Option.enc(encU32Be)(data));
        const decoded = Result.unwrap(runDecoder(Option.dec(decU32Be()))(code));
        assertEquals(decoded, data);
    }
});

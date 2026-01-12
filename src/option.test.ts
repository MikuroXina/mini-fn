import { expect, test } from "vitest";
import { Array, Compose, Identity, Result } from "../mod.js";
import * as Option from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.js";
import { stringEq } from "./type-class/eq.js";
import { stringOrd } from "./type-class/ord.js";

test("partial equality", () => {
    expect(
        Option.partialEquality(stringEq)(Option.none(), Option.none()),
    ).toStrictEqual(true);
    expect(
        Option.partialEquality(stringEq)(Option.some("xxx"), Option.none()),
    ).toStrictEqual(false);
    expect(
        Option.partialEquality(stringEq)(Option.none(), Option.some("xxx")),
    ).toStrictEqual(false);
    expect(
        Option.partialEquality(stringEq)(
            Option.some("xxx"),
            Option.some("xxy"),
        ),
    ).toStrictEqual(false);
    expect(
        Option.partialEquality(stringEq)(
            Option.some("xxx"),
            Option.some("xxx"),
        ),
    ).toStrictEqual(true);
});

test("partial order", () => {
    const optionStrCmp = Option.partialCmp(stringOrd);
    expect(optionStrCmp(Option.none(), Option.none())).toStrictEqual(
        Option.some<Ordering>(equal),
    );
    expect(optionStrCmp(Option.none(), Option.some("abc"))).toStrictEqual(
        Option.some<Ordering>(less),
    );
    expect(optionStrCmp(Option.some("abc"), Option.none())).toStrictEqual(
        Option.some<Ordering>(greater),
    );
    expect(optionStrCmp(Option.some("abc"), Option.some("xyz"))).toStrictEqual(
        Option.some<Ordering>(less),
    );
    expect(optionStrCmp(Option.some("xyz"), Option.some("abc"))).toStrictEqual(
        Option.some<Ordering>(greater),
    );
    expect(optionStrCmp(Option.some("xyz"), Option.some("xyz"))).toStrictEqual(
        Option.some<Ordering>(equal),
    );
});

test("total order", () => {
    const optionStrCmp = Option.cmp(stringOrd);
    expect(optionStrCmp(Option.none(), Option.none())).toStrictEqual(equal);
    expect(optionStrCmp(Option.none(), Option.some("abc"))).toStrictEqual(less);
    expect(optionStrCmp(Option.some("abc"), Option.none())).toStrictEqual(
        greater,
    );
    expect(optionStrCmp(Option.some("abc"), Option.some("xyz"))).toStrictEqual(
        less,
    );
    expect(optionStrCmp(Option.some("xyz"), Option.some("abc"))).toStrictEqual(
        greater,
    );
    expect(optionStrCmp(Option.some("xyz"), Option.some("xyz"))).toStrictEqual(
        equal,
    );
});

test("toString", () => {
    expect(Option.toString(Option.some(4))).toStrictEqual("some(4)");
    expect(Option.toString(Option.none())).toStrictEqual("none");
});

test("flatten", () => {
    expect(Option.flatten(Option.some(Option.some(4)))).toStrictEqual(
        Option.some(4),
    );
    expect(Option.flatten(Option.some(Option.none()))).toStrictEqual(
        Option.none(),
    );
    expect(Option.flatten(Option.none())).toStrictEqual(Option.none());
});

test("and", () => {
    expect(Option.and(Option.none())(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(Option.and(Option.none())(Option.some(2))).toStrictEqual(
        Option.none(),
    );
    expect(Option.and(Option.some("foo"))(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(Option.and(Option.some("foo"))(Option.some(2))).toStrictEqual(
        Option.some("foo"),
    );
});

test("andThen", () => {
    const sqrtThenToString = (num: number): Option.Option<string> =>
        0 <= num ? Option.some(Math.sqrt(num).toString()) : Option.none();

    const applied = Option.andThen(sqrtThenToString);
    expect(applied(Option.some(4))).toStrictEqual(Option.some("2"));
    expect(applied(Option.some(-1))).toStrictEqual(Option.none());
    expect(applied(Option.none())).toStrictEqual(Option.none());
});

test("or", () => {
    expect(Option.or(Option.none())(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(Option.or(Option.none())(Option.some(2))).toStrictEqual(
        Option.some(2),
    );
    expect(Option.or(Option.some(100))(Option.none())).toStrictEqual(
        Option.some(100),
    );
    expect(Option.or(Option.some(100))(Option.some(2))).toStrictEqual(
        Option.some(2),
    );
});

test("orElse", () => {
    const nobody = Option.orElse((): Option.Option<string> => Option.none());
    const vikings = Option.orElse(
        (): Option.Option<string> => Option.some("vikings"),
    );

    expect(vikings(Option.some("barbarians"))).toStrictEqual(
        Option.some("barbarians"),
    );
    expect(vikings(Option.none())).toStrictEqual(Option.some("vikings"));
    expect(nobody(Option.none())).toStrictEqual(Option.none());
});

test("xor", () => {
    expect(Option.xor(Option.none())(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(Option.xor(Option.none())(Option.some(2))).toStrictEqual(
        Option.some(2),
    );
    expect(Option.xor(Option.some(100))(Option.none())).toStrictEqual(
        Option.some(100),
    );
    expect(Option.xor(Option.some(100))(Option.some(2))).toStrictEqual(
        Option.none(),
    );
});

test("isSomeAnd", () => {
    expect(
        Option.isSomeAnd((x: number) => x >= 2)(Option.some(2)),
    ).toStrictEqual(true);
    expect(
        Option.isSomeAnd((x: number) => x >= 2)(Option.some(1.9)),
    ).toStrictEqual(false);
    expect(
        Option.isSomeAnd((x: number) => x >= 2)(Option.none()),
    ).toStrictEqual(false);
});

test("isNoneOr", () => {
    expect(
        Option.isNoneOr((x: number) => x >= 2)(Option.some(2)),
    ).toStrictEqual(true);
    expect(
        Option.isNoneOr((x: number) => x >= 2)(Option.some(1.9)),
    ).toStrictEqual(false);
    expect(Option.isNoneOr((x: number) => x >= 2)(Option.none())).toStrictEqual(
        true,
    );
});

test("filter", () => {
    const isEven = Option.filter((x: number) => x % 2 === 0);
    expect(isEven(Option.none())).toStrictEqual(Option.none());
    expect(isEven(Option.some(3))).toStrictEqual(Option.none());
    expect(isEven(Option.some(4))).toStrictEqual(Option.some(4));
});

test("unzip", () => {
    expect(Option.unzip(Option.some([1, "hi"]))).toStrictEqual([
        Option.some(1),
        Option.some("hi"),
    ]);
    expect(Option.unzip(Option.none())).toStrictEqual([
        Option.none(),
        Option.none(),
    ]);
});

test("zipWith", () => {
    interface Point {
        x: number;
        y: number;
    }
    const newPoint = Option.zipWith(
        (x: number, y: number): Point => ({
            x,
            y,
        }),
    );
    expect(newPoint(Option.some(17.5))(Option.some(42.7))).toStrictEqual(
        Option.some({ x: 17.5, y: 42.7 }),
    );
    expect(newPoint(Option.none())(Option.none())).toStrictEqual(Option.none());
});

test("unwrapOr", () => {
    const unwrapOrBike = Option.unwrapOr("bike");
    expect(unwrapOrBike(Option.some("car"))).toStrictEqual("car");
    expect(unwrapOrBike(Option.none())).toStrictEqual("bike");
});

test("unwrapOrElse", () => {
    const unwrapOrCalc = Option.unwrapOrElse(() => 6 ** 4);
    expect(unwrapOrCalc(Option.some(4))).toStrictEqual(4);
    expect(unwrapOrCalc(Option.none())).toStrictEqual(1296);
});

test("contains", () => {
    const hasTwo = Option.contains(2);
    expect(hasTwo(Option.some(2))).toStrictEqual(true);
    expect(hasTwo(Option.some(3))).toStrictEqual(false);
    expect(hasTwo(Option.none())).toStrictEqual(false);
});

test("transpose", () => {
    expect(Option.optResToResOpt(Option.some(Result.ok(5)))).toStrictEqual(
        Result.ok(Option.some(5)),
    );
    expect(Option.optResToResOpt(Option.none())).toStrictEqual(
        Result.ok(Option.none()),
    );
    expect(Option.optResToResOpt(Option.some(Result.err(5)))).toStrictEqual(
        Result.err(5),
    );
});

test("okOr", () => {
    const orZero = Option.okOr(0);
    expect(orZero(Option.some("foo"))).toStrictEqual(Result.ok("foo"));
    expect(orZero(Option.none())).toStrictEqual(Result.err(0));
});

test("okOrElse", () => {
    const orZero = Option.okOrElse(() => 0);
    expect(orZero(Option.some("foo"))).toStrictEqual(Result.ok("foo"));
    expect(orZero(Option.none())).toStrictEqual(Result.err(0));
});

test("foldR", () => {
    const applied = Option.foldR((next: number) => (acc: number) => next + acc)(
        1,
    );

    expect(applied(Option.some(2))).toStrictEqual(3);
    expect(applied(Option.some(5))).toStrictEqual(6);
    expect(applied(Option.none())).toStrictEqual(1);
});

test("traversable functor", () => {
    // naturality
    const first = <T>(x: readonly T[]): Option.Option<T> =>
        0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    for (const data of [Option.some("fever"), Option.none()]) {
        expect(
            first(Option.traversable.traverse(Array.applicative)(dup)(data)),
        ).toStrictEqual(
            Option.traversable.traverse(Option.applicative)((item: string) =>
                first(dup(item)),
            )(data),
        );
    }

    // identity
    const num = Option.some(5);
    expect(
        Option.traversable.traverse(Identity.applicative)((a: number) => a)(
            num,
        ),
    ).toStrictEqual(num);

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [Option.some("nice"), Option.none()]) {
        expect(
            Option.traversable.traverse(app)((item: string) =>
                Array.map(firstCh)(dup(item)),
            )(x),
        ).toStrictEqual(
            Array.map(Option.traversable.traverse(Option.applicative)(firstCh))(
                Option.traversable.traverse(Array.applicative)(dup)(x),
            ),
        );
    }
});

test("monoid", () => {
    const m = Option.monoid<number>();

    // associative
    {
        const x = Option.some(4);
        const y = Option.some(3);
        const z = Option.some(8);
        expect(m.combine(m.combine(x, y), z)).toStrictEqual(
            m.combine(x, m.combine(y, z)),
        );
    }

    // identity
    {
        const x = Option.some(4);
        expect(m.combine(x, m.identity)).toStrictEqual(x);
        expect(m.combine(m.identity, x)).toStrictEqual(x);
    }
});

test("encode then decode", () => {
    for (const data of [Option.some(4), Option.none()]) {
        const code = runCode(Option.enc(encU32Be)(data));
        const decoded = Result.unwrap(runDecoder(Option.dec(decU32Be()))(code));
        expect(decoded).toStrictEqual(data);
    }
});

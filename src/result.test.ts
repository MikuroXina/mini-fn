import { expect, test } from "vitest";
import { Array, Compose, Identity, Option, Result } from "../mod.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.js";
import { stringOrd } from "./type-class/ord.js";

test("partial order", () => {
    const resultStrCmp = Result.partialCmp({
        orderE: stringOrd,
        orderT: stringOrd,
    });
    expect(resultStrCmp(Result.err(""), Result.err(""))).toStrictEqual(
        Option.some<Ordering>(equal),
    );
    expect(resultStrCmp(Result.err(""), Result.ok("abc"))).toStrictEqual(
        Option.some<Ordering>(greater),
    );
    expect(resultStrCmp(Result.ok("abc"), Result.err(""))).toStrictEqual(
        Option.some<Ordering>(less),
    );
    expect(resultStrCmp(Result.ok("abc"), Result.ok("xyz"))).toStrictEqual(
        Option.some<Ordering>(less),
    );
    expect(resultStrCmp(Result.ok("xyz"), Result.ok("abc"))).toStrictEqual(
        Option.some<Ordering>(greater),
    );
    expect(resultStrCmp(Result.ok("xyz"), Result.ok("xyz"))).toStrictEqual(
        Option.some<Ordering>(equal),
    );
});

test("total order", () => {
    const resultStrCmp = Result.cmp({
        orderE: stringOrd,
        orderT: stringOrd,
    });
    expect(resultStrCmp(Result.err(""), Result.err(""))).toStrictEqual(equal);
    expect(resultStrCmp(Result.err(""), Result.ok("abc"))).toStrictEqual(
        greater,
    );
    expect(resultStrCmp(Result.ok("abc"), Result.err(""))).toStrictEqual(less);
    expect(resultStrCmp(Result.ok("abc"), Result.ok("xyz"))).toStrictEqual(
        less,
    );
    expect(resultStrCmp(Result.ok("xyz"), Result.ok("abc"))).toStrictEqual(
        greater,
    );
    expect(resultStrCmp(Result.ok("xyz"), Result.ok("xyz"))).toStrictEqual(
        equal,
    );
});

test("wrapThrowable", () => {
    const safeSqrt = Result.wrapThrowable((err) => err as Error)(
        (x: number) => {
            if (!(x >= 0)) {
                throw new RangeError("x must be positive or a zero");
            }
            return Math.sqrt(x);
        },
    );
    expect(safeSqrt(4)).toStrictEqual(Result.ok(2));
    expect(safeSqrt(0)).toStrictEqual(Result.ok(0));
    expect(safeSqrt(-1)).toStrictEqual(
        Result.err(new RangeError("x must be positive or a zero")),
    );
});

test("wrapAsyncThrowable", async () => {
    const safeSqrt = Result.wrapAsyncThrowable((err) => err as Error)(
        (x: number) => {
            if (!(x >= 0)) {
                return Promise.reject(
                    new RangeError("x must be positive or a zero"),
                );
            }
            return Promise.resolve(Math.sqrt(x));
        },
    );
    expect(await safeSqrt(4)).toStrictEqual(Result.ok(2));
    expect(await safeSqrt(0)).toStrictEqual(Result.ok(0));
    expect(await safeSqrt(-1)).toStrictEqual(
        Result.err(new RangeError("x must be positive or a zero")),
    );
});

test("flatten", () => {
    expect(Result.flatten(Result.ok(Result.ok("hello")))).toStrictEqual(
        Result.ok("hello"),
    );
    expect(Result.flatten(Result.err(Result.ok("hello")))).toStrictEqual(
        Result.err(Result.ok("hello")),
    );
    expect(Result.flatten(Result.ok(Result.err(6)))).toStrictEqual(
        Result.err(6),
    );
    expect(Result.flatten(Result.err(Result.err(6)))).toStrictEqual(
        Result.err(Result.err(6)),
    );
});

test("mergeOkErr", () => {
    expect(Result.mergeOkErr(Result.ok(3))).toStrictEqual(3);
    expect(Result.mergeOkErr(Result.err(4))).toStrictEqual(4);
});

test("unwrap", () => {
    expect(Result.unwrap(Result.ok(3))).toStrictEqual(3);
    expect(() => Result.unwrap(Result.err(4))).toThrowError("unwrapped Err");
});

test("unwrapErr", () => {
    expect(() => Result.unwrapErr(Result.ok(3))).toThrowError("unwrapped Ok");
    expect(Result.unwrapErr(Result.err(4))).toStrictEqual(4);
});

test("and", () => {
    const success = Result.ok<number>(2);
    const failure = Result.err("not a 2");
    const lateError = Result.err("late error");
    const earlyError = Result.err("early error");
    const anotherSuccess = Result.ok("different result");

    expect(Result.and(lateError)(success)).toStrictEqual(lateError);
    expect(Result.and<number, string>(success)(earlyError)).toStrictEqual(
        earlyError,
    );
    expect(Result.and(lateError)(failure)).toStrictEqual(failure);
    expect(Result.and(anotherSuccess)(success)).toStrictEqual(anotherSuccess);
});

test("andThen", () => {
    const sqrtThenToString = Result.andThen(
        (num: number): Result.Result<string, string> =>
            num < 0
                ? Result.err("num must not be negative")
                : Result.ok(Math.sqrt(num).toString()),
    );

    expect(sqrtThenToString(Result.ok(4))).toStrictEqual(Result.ok("2"));
    expect(sqrtThenToString(Result.ok(-1))).toStrictEqual(
        Result.err("num must not be negative"),
    );
    expect(sqrtThenToString(Result.err("not a number"))).toStrictEqual(
        Result.err("not a number"),
    );
});

test("asyncAndThen", async () => {
    const sqrtThenToString = Result.asyncAndThen(
        (num: number): Promise<Result.Result<string, string>> =>
            Promise.resolve(
                num < 0
                    ? Result.err("num must not be negative")
                    : Result.ok(Math.sqrt(num).toString()),
            ),
    );

    expect(await sqrtThenToString(Result.ok(4))).toStrictEqual(Result.ok("2"));
    expect(await sqrtThenToString(Result.ok(-1))).toStrictEqual(
        Result.err("num must not be negative"),
    );
    expect(await sqrtThenToString(Result.err("not a number"))).toStrictEqual(
        Result.err("not a number"),
    );
});

test("or", () => {
    const success = Result.ok<number>(2);
    const failure = Result.err<string>("not a 2");
    const lateError = Result.err<string>("late error");
    const earlyError = Result.err<string>("early error");
    const anotherSuccess = Result.ok<number>(100);

    expect(Result.or<string, number>(lateError)(success)).toStrictEqual(
        success,
    );
    expect(Result.or<string, number>(success)(earlyError)).toStrictEqual(
        success,
    );
    expect(Result.or(lateError)(failure)).toStrictEqual(lateError);
    expect(Result.or(anotherSuccess)(success)).toStrictEqual(success);
});

test("orElse", () => {
    const sq = Result.orElse((x: number) => Result.ok<number>(x * x));
    const residual = Result.orElse((x: number) => Result.err<number>(x));

    expect(sq(sq(Result.ok(2)))).toStrictEqual(Result.ok(2));
    expect(sq(residual(Result.ok(2)))).toStrictEqual(Result.ok(2));
    expect(residual(sq(Result.err(3)))).toStrictEqual(Result.ok(9));
    expect(residual(residual(Result.err(3)))).toStrictEqual(Result.err(3));
});

test("optionOk", () => {
    expect(Result.optionOk(Result.ok(2))).toStrictEqual(Option.some(2));
    expect(Result.optionOk(Result.err("nothing left"))).toStrictEqual(
        Option.none(),
    );
});

test("optionErr", () => {
    expect(Result.optionErr(Result.ok(2))).toStrictEqual(Option.none());
    expect(Result.optionErr(Result.err("nothing left"))).toStrictEqual(
        Option.some("nothing left"),
    );
});

test("toString", () => {
    expect(Result.toString(Result.ok(24))).toStrictEqual("ok(24)");
    expect(Result.toString(Result.err("hoge"))).toStrictEqual("err(hoge)");
});

test("toArray", () => {
    expect(Result.toArray(Result.ok(24))).toStrictEqual([24]);
    expect(Result.toArray(Result.err("hoge"))).toStrictEqual([]);
});

test("mapOr", () => {
    const lenOrAnswer = Result.mapOr(42)((x: string) => x.length);

    expect(lenOrAnswer(Result.ok("foo"))).toStrictEqual(3);
    expect(lenOrAnswer(Result.err("bar"))).toStrictEqual(42);
});

test("mapOrElse", () => {
    const k = 21;
    const lenOrAnswer = Result.mapOrElse(() => k * 2)((x: string) => x.length);

    expect(lenOrAnswer(Result.ok("foo"))).toStrictEqual(3);
    expect(lenOrAnswer(Result.err("bar"))).toStrictEqual(42);
});

test("mapErr", () => {
    const prefix = Result.mapErr((msg: string) => `LOG: ${msg}`);

    expect(prefix(Result.ok(2))).toStrictEqual(Result.ok(2));
    expect(prefix(Result.err("failure"))).toStrictEqual(
        Result.err("LOG: failure"),
    );
});

test("asyncMap", async () => {
    const len = Result.asyncMap((text: string) => Promise.resolve(text.length));

    expect(await len(Result.ok(""))).toStrictEqual(Result.ok(0));
    expect(await len(Result.ok("foo"))).toStrictEqual(Result.ok(3));
    expect(await len(Result.err("fail"))).toStrictEqual(Result.err("fail"));
    expect(await len(Result.err(-1))).toStrictEqual(Result.err(-1));
});

test("product", () => {
    expect(Result.product(Result.ok("foo"))(Result.ok("bar"))).toStrictEqual(
        Result.ok(["foo", "bar"] as [string, string]),
    );
    expect(Result.product(Result.ok("foo"))(Result.err("err"))).toStrictEqual(
        Result.err("err"),
    );
    expect(Result.product(Result.err("err"))(Result.ok("bar"))).toStrictEqual(
        Result.err("err"),
    );
    expect(Result.product(Result.err("err"))(Result.err("fool"))).toStrictEqual(
        Result.err("err"),
    );
});

test("unwrapOr", () => {
    const applied = Result.unwrapOr(42);

    expect(applied(Result.ok(9))).toStrictEqual(9);
    expect(applied(Result.err("error"))).toStrictEqual(42);
});

test("unwrapOrElse", () => {
    const applied = Result.unwrapOrElse((x: string) => x.length);

    expect(applied(Result.ok(2))).toStrictEqual(2);
    expect(applied(Result.err("foo"))).toStrictEqual(3);
});

test("biMap", () => {
    const applied = Result.biMap((mes: string) => `ERROR: ${mes}`)(
        (num: number) => num * 2,
    );

    expect(applied(Result.ok(21))).toStrictEqual(Result.ok(42));
    expect(applied(Result.err("wow"))).toStrictEqual(Result.err("ERROR: wow"));
});

test("transpose", () => {
    expect(Result.resOptToOptRes(Result.ok(Option.some(5)))).toStrictEqual(
        Option.some(Result.ok(5)),
    );
    expect(Result.resOptToOptRes(Result.ok(Option.none()))).toStrictEqual(
        Option.none(),
    );
    expect(Result.resOptToOptRes(Result.err(5))).toStrictEqual(
        Option.some(Result.err(5)),
    );
});

test("collect", () => {
    expect(Result.collect([])).toStrictEqual(Result.ok([]));

    expect(Result.collect([Result.ok(3), Result.ok("1")])).toStrictEqual(
        Result.ok([3, "1"] as [number, string]),
    );

    expect(
        Result.collect([
            Result.ok(3),
            Result.err("1"),
            Result.ok(4n),
            Result.err(new Error("wow")),
        ]),
    ).toStrictEqual(Result.err("1"));
    expect(
        Result.collect([
            Result.ok(3),
            Result.err(new Error("wow")),
            Result.ok(4n),
            Result.err("1"),
        ]),
    ).toStrictEqual(Result.err(new Error("wow")));
});

test("inspect", () => {
    Result.inspect((value: string) => {
        expect(value).toStrictEqual("foo");
    })(Result.ok("foo"));

    Result.inspect(() => {
        throw new Error("unreachable");
    })(Result.err(42));
});

test("functor laws", () => {
    const f = Result.functor<string>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            expect(f.map((x: number) => x)(v)).toStrictEqual(v);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            expect(f.map((x: number) => add3(mul2(x)))(v)).toStrictEqual(
                f.map(add3)(f.map(mul2)(v)),
            );
        }
    }
});

test("applicative functor laws", () => {
    const app = Result.applicative<string>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            expect(app.apply(app.pure((i: number) => i))(v)).toStrictEqual(v);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
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
                        )(Result.ok(mul2)),
                    )(Result.ok(add3)),
                )(v),
            ).toStrictEqual(
                app.apply(Result.ok(mul2))(app.apply(Result.ok(add3))(v)),
            );
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        expect(app.apply(app.pure(mul2))(app.pure(x))).toStrictEqual(
            app.pure(mul2(x)),
        );
    }

    // interchange
    for (let x = -100; x <= 100; ++x) {
        expect(app.apply(Result.ok(mul2))(app.pure(x))).toStrictEqual(
            app.apply(app.pure((f: (x: number) => number) => f(x)))(
                Result.ok(mul2),
            ),
        );
    }
});

test("monad laws", () => {
    const m = Result.monad<string>();
    // left identity
    const sqrt = (x: number) =>
        x >= 0
            ? Result.ok(Math.sqrt(x))
            : Result.err("square root of negative is not a number");
    for (let x = -100; x <= 100; ++x) {
        expect(m.flatMap(sqrt)(m.pure(x))).toStrictEqual(sqrt(x));
    }

    // right identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            expect(m.flatMap(m.pure)(v)).toStrictEqual(v);
        }
    }

    // associativity
    const log = (x: number) =>
        x >= 0
            ? Result.ok(Math.log(x))
            : Result.err("natural logarithm of negative is not a number");
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            expect(m.flatMap(sqrt)(m.flatMap(log)(v))).toStrictEqual(
                m.flatMap((x: number) => m.flatMap(sqrt)(log(x)))(v),
            );
        }
    }
});

test("traversable functor laws", () => {
    const tra = Result.traversable<string>();
    // naturality
    const first = <T>(x: readonly T[]): Option.Option<T> =>
        0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [`${x}0`, `${x}1`];
    for (const data of [Result.ok("foo"), Result.err("err")]) {
        expect(first(tra.traverse(Array.applicative)(dup)(data))).toStrictEqual(
            tra.traverse(Option.applicative)((item: string) =>
                first(dup(item)),
            )(data),
        );
    }

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(`${x}`), Result.err(`${x}`)]) {
            expect(
                tra.traverse(Identity.applicative)((a: string) => a)(v),
            ).toStrictEqual(v);
        }
    }

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [Result.ok("nice"), Result.err("error")]) {
        expect(
            tra.traverse(app)((item: string) => Array.map(firstCh)(dup(item)))(
                x,
            ),
        ).toStrictEqual(
            Array.map(tra.traverse(Option.applicative)(firstCh))(
                tra.traverse(Array.applicative)(dup)(x),
            ),
        );
    }
});

test("bitraversable functor laws", () => {
    const k = 21;
    const lenOrAnswer = Result.bitraversable.biMap((x: string) => x.length)(
        () => k * 2,
    );
    expect(lenOrAnswer(Result.ok("foo"))).toStrictEqual(Result.ok(42));
    expect(lenOrAnswer(Result.err("bar"))).toStrictEqual(Result.err(3));

    expect(
        Result.bitraversable.bifoldR(
            (msg: string) => (acc: string) => `${msg}, ${acc}`,
        )((num: number) => (acc: string) => `${num}, ${acc}`)("end")(
            Result.ok(2),
        ),
    ).toStrictEqual("2, end");
    expect(
        Result.bitraversable.bifoldR(
            (msg: string) => (acc: string) => `${msg}, ${acc}`,
        )((num: number) => (acc: string) => `${num}, ${acc}`)("end")(
            Result.err("foo"),
        ),
    ).toStrictEqual("foo, end");

    expect(
        Result.bitraversable.bitraverse(Array.applicative)((x: string) => [
            "ERROR",
            x,
        ])((x: number) => [x, x + 1])(Result.ok(2)),
    ).toStrictEqual([Result.ok(2), Result.ok(3)]);
    expect(
        Result.bitraversable.bitraverse(Array.applicative)((x: string) => [
            "ERROR",
            x,
        ])((x: number) => [x, x + 1])(Result.err("foo")),
    ).toStrictEqual([Result.err("ERROR"), Result.err("foo")]);
});

test("encode then decode", () => {
    const encoder = Result.enc(encUtf8)(encU32Be);
    const decoder = Result.dec(decUtf8())(decU32Be());
    for (const v of [Result.ok(32), Result.err("failure")]) {
        const code = runCode(encoder(v));
        const decoded = Result.unwrap(runDecoder(decoder)(code));
        expect(decoded).toStrictEqual(v);
    }
});

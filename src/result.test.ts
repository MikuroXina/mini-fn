import { assertEquals, assertThrows } from "../deps.ts";
import { Array, Compose, Identity, Option, Result } from "../mod.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.ts";
import { stringOrd } from "./type-class/ord.ts";

Deno.test("partial order", () => {
    const resultStrCmp = Result.partialCmp({
        orderE: stringOrd,
        orderT: stringOrd,
    });
    assertEquals(
        resultStrCmp(Result.err(""), Result.err("")),
        Option.some<Ordering>(equal),
    );
    assertEquals(
        resultStrCmp(Result.err(""), Result.ok("abc")),
        Option.some<Ordering>(greater),
    );
    assertEquals(
        resultStrCmp(Result.ok("abc"), Result.err("")),
        Option.some<Ordering>(less),
    );
    assertEquals(
        resultStrCmp(Result.ok("abc"), Result.ok("xyz")),
        Option.some<Ordering>(less),
    );
    assertEquals(
        resultStrCmp(Result.ok("xyz"), Result.ok("abc")),
        Option.some<Ordering>(greater),
    );
    assertEquals(
        resultStrCmp(Result.ok("xyz"), Result.ok("xyz")),
        Option.some<Ordering>(equal),
    );
});

Deno.test("total order", () => {
    const resultStrCmp = Result.cmp({
        orderE: stringOrd,
        orderT: stringOrd,
    });
    assertEquals(
        resultStrCmp(Result.err(""), Result.err("")),
        equal,
    );
    assertEquals(
        resultStrCmp(Result.err(""), Result.ok("abc")),
        greater,
    );
    assertEquals(
        resultStrCmp(Result.ok("abc"), Result.err("")),
        less,
    );
    assertEquals(
        resultStrCmp(Result.ok("abc"), Result.ok("xyz")),
        less,
    );
    assertEquals(
        resultStrCmp(Result.ok("xyz"), Result.ok("abc")),
        greater,
    );
    assertEquals(
        resultStrCmp(Result.ok("xyz"), Result.ok("xyz")),
        equal,
    );
});

Deno.test("wrapThrowable", () => {
    const safeSqrt = Result.wrapThrowable((err) => err as Error)(
        (x: number) => {
            if (!(x >= 0)) {
                throw new RangeError("x must be positive or a zero");
            }
            return Math.sqrt(x);
        },
    );
    assertEquals(safeSqrt(4), Result.ok(2));
    assertEquals(safeSqrt(0), Result.ok(0));
    assertEquals(
        safeSqrt(-1),
        Result.err(new RangeError("x must be positive or a zero")),
    );
});

Deno.test("wrapAsyncThrowable", async () => {
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
    assertEquals(await safeSqrt(4), Result.ok(2));
    assertEquals(await safeSqrt(0), Result.ok(0));
    assertEquals(
        await safeSqrt(-1),
        Result.err(new RangeError("x must be positive or a zero")),
    );
});

Deno.test("flatten", () => {
    assertEquals(
        Result.flatten(Result.ok(Result.ok("hello"))),
        Result.ok("hello"),
    );
    assertEquals(
        Result.flatten(Result.err(Result.ok("hello"))),
        Result.err(Result.ok("hello")),
    );
    assertEquals(Result.flatten(Result.ok(Result.err(6))), Result.err(6));
    assertEquals(
        Result.flatten(Result.err(Result.err(6))),
        Result.err(Result.err(6)),
    );
});

Deno.test("mergeOkErr", () => {
    assertEquals(Result.mergeOkErr(Result.ok(3)), 3);
    assertEquals(Result.mergeOkErr(Result.err(4)), 4);
});

Deno.test("unwrap", () => {
    assertEquals(Result.unwrap(Result.ok(3)), 3);
    assertThrows(() => Result.unwrap(Result.err(4)), "unwrapped Err");
});

Deno.test("unwrapErr", () => {
    assertThrows(() => Result.unwrapErr(Result.ok(3)), "unwrapped Ok");
    assertEquals(Result.unwrapErr(Result.err(4)), 4);
});

Deno.test("and", () => {
    const success = Result.ok<number>(2);
    const failure = Result.err("not a 2");
    const lateError = Result.err("late error");
    const earlyError = Result.err("early error");
    const anotherSuccess = Result.ok("different result");

    assertEquals(Result.and(lateError)(success), lateError);
    assertEquals(Result.and<number, string>(success)(earlyError), earlyError);
    assertEquals(Result.and(lateError)(failure), failure);
    assertEquals(Result.and(anotherSuccess)(success), anotherSuccess);
});

Deno.test("andThen", () => {
    const sqrtThenToString = Result.andThen(
        (num: number): Result.Result<string, string> =>
            num < 0
                ? Result.err("num must not be negative")
                : Result.ok(Math.sqrt(num).toString()),
    );

    assertEquals(sqrtThenToString(Result.ok(4)), Result.ok("2"));
    assertEquals(
        sqrtThenToString(Result.ok(-1)),
        Result.err("num must not be negative"),
    );
    assertEquals(
        sqrtThenToString(Result.err("not a number")),
        Result.err("not a number"),
    );
});

Deno.test("asyncAndThen", async () => {
    const sqrtThenToString = Result.asyncAndThen(
        (num: number): Promise<Result.Result<string, string>> =>
            Promise.resolve(
                num < 0
                    ? Result.err("num must not be negative")
                    : Result.ok(Math.sqrt(num).toString()),
            ),
    );

    assertEquals(await sqrtThenToString(Result.ok(4)), Result.ok("2"));
    assertEquals(
        await sqrtThenToString(Result.ok(-1)),
        Result.err("num must not be negative"),
    );
    assertEquals(
        await sqrtThenToString(Result.err("not a number")),
        Result.err("not a number"),
    );
});

Deno.test("or", () => {
    const success = Result.ok<number>(2);
    const failure = Result.err<string>("not a 2");
    const lateError = Result.err<string>("late error");
    const earlyError = Result.err<string>("early error");
    const anotherSuccess = Result.ok<number>(100);

    assertEquals(Result.or<string, number>(lateError)(success), success);
    assertEquals(Result.or<string, number>(success)(earlyError), success);
    assertEquals(Result.or(lateError)(failure), lateError);
    assertEquals(Result.or(anotherSuccess)(success), success);
});

Deno.test("orElse", () => {
    const sq = Result.orElse((x: number) => Result.ok<number>(x * x));
    const residual = Result.orElse((x: number) => Result.err<number>(x));

    assertEquals(sq(sq(Result.ok(2))), Result.ok(2));
    assertEquals(sq(residual(Result.ok(2))), Result.ok(2));
    assertEquals(residual(sq(Result.err(3))), Result.ok(9));
    assertEquals(residual(residual(Result.err(3))), Result.err(3));
});

Deno.test("optionOk", () => {
    assertEquals(Result.optionOk(Result.ok(2)), Option.some(2));
    assertEquals(Result.optionOk(Result.err("nothing left")), Option.none());
});

Deno.test("optionErr", () => {
    assertEquals(Result.optionErr(Result.ok(2)), Option.none());
    assertEquals(
        Result.optionErr(Result.err("nothing left")),
        Option.some("nothing left"),
    );
});

Deno.test("toString", () => {
    assertEquals(Result.toString(Result.ok(24)), "ok(24)");
    assertEquals(Result.toString(Result.err("hoge")), "err(hoge)");
});

Deno.test("toArray", () => {
    assertEquals(Result.toArray(Result.ok(24)), [24]);
    assertEquals(Result.toArray(Result.err("hoge")), []);
});

Deno.test("mapOr", () => {
    const lenOrAnswer = Result.mapOr(42)((x: string) => x.length);

    assertEquals(lenOrAnswer(Result.ok("foo")), 3);
    assertEquals(lenOrAnswer(Result.err("bar")), 42);
});

Deno.test("mapOrElse", () => {
    const k = 21;
    const lenOrAnswer = Result.mapOrElse(() => k * 2)((x: string) => x.length);

    assertEquals(lenOrAnswer(Result.ok("foo")), 3);
    assertEquals(lenOrAnswer(Result.err("bar")), 42);
});

Deno.test("mapErr", () => {
    const prefix = Result.mapErr((msg: string) => "LOG: " + msg);

    assertEquals(prefix(Result.ok(2)), Result.ok(2));
    assertEquals(prefix(Result.err("failure")), Result.err("LOG: failure"));
});

Deno.test("asyncMap", async () => {
    const len = Result.asyncMap((text: string) => Promise.resolve(text.length));

    assertEquals(await len(Result.ok("")), Result.ok(0));
    assertEquals(await len(Result.ok("foo")), Result.ok(3));
    assertEquals(await len(Result.err("fail")), Result.err("fail"));
    assertEquals(await len(Result.err(-1)), Result.err(-1));
});

Deno.test("product", () => {
    assertEquals(
        Result.product(Result.ok("foo"))(Result.ok("bar")),
        Result.ok(["foo", "bar"] as [string, string]),
    );
    assertEquals(
        Result.product(Result.ok("foo"))(Result.err("err")),
        Result.err("err"),
    );
    assertEquals(
        Result.product(Result.err("err"))(Result.ok("bar")),
        Result.err("err"),
    );
    assertEquals(
        Result.product(Result.err("err"))(Result.err("fool")),
        Result.err("err"),
    );
});

Deno.test("unwrapOr", () => {
    const applied = Result.unwrapOr(42);

    assertEquals(applied(Result.ok(9)), 9);
    assertEquals(applied(Result.err("error")), 42);
});

Deno.test("unwrapOrElse", () => {
    const applied = Result.unwrapOrElse((x: string) => x.length);

    assertEquals(applied(Result.ok(2)), 2);
    assertEquals(applied(Result.err("foo")), 3);
});

Deno.test("biMap", () => {
    const applied = Result.biMap((mes: string) => "ERROR: " + mes)((
        num: number,
    ) => num * 2);

    assertEquals(applied(Result.ok(21)), Result.ok(42));
    assertEquals(applied(Result.err("wow")), Result.err("ERROR: wow"));
});

Deno.test("transpose", () => {
    assertEquals(
        Result.resOptToOptRes(Result.ok(Option.some(5))),
        Option.some(Result.ok(5)),
    );
    assertEquals(
        Result.resOptToOptRes(Result.ok(Option.none())),
        Option.none(),
    );
    assertEquals(
        Result.resOptToOptRes(Result.err(5)),
        Option.some(Result.err(5)),
    );
});

Deno.test("collect", () => {
    assertEquals(Result.collect([]), Result.ok([]));

    assertEquals(
        Result.collect([
            Result.ok(3),
            Result.ok("1"),
        ]),
        Result.ok([3, "1"] as [number, string]),
    );

    assertEquals(
        Result.collect([
            Result.ok(3),
            Result.err("1"),
            Result.ok(4n),
            Result.err(new Error("wow")),
        ]),
        Result.err("1"),
    );
    assertEquals(
        Result.collect([
            Result.ok(3),
            Result.err(new Error("wow")),
            Result.ok(4n),
            Result.err("1"),
        ]),
        Result.err(new Error("wow")),
    );
});

Deno.test("inspect", () => {
    Result.inspect((value: string) => {
        assertEquals(value, "foo");
    })(Result.ok("foo"));

    Result.inspect(() => {
        throw new Error("unreachable");
    })(Result.err(42));
});

Deno.test("functor laws", () => {
    const f = Result.functor<string>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            assertEquals(f.map((x: number) => x)(v), v);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            assertEquals(
                f.map((x: number) => add3(mul2(x)))(v),
                f.map(add3)(f.map(mul2)(v)),
            );
        }
    }
});

Deno.test("applicative functor laws", () => {
    const app = Result.applicative<string>();
    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            assertEquals(app.apply(app.pure((i: number) => i))(v), v);
        }
    }

    // composition
    const mul2 = (x: number) => x * 2;
    const add3 = (x: number) => x + 3;
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            assertEquals(
                app.apply(
                    app.apply(
                        app.apply(
                            app.pure(
                                (f: (x: number) => number) =>
                                (g: (x: number) => number) =>
                                (i: number) => f(g(i)),
                            ),
                        )(Result.ok(mul2)),
                    )(Result.ok(add3)),
                )(v),
                app.apply(Result.ok(mul2))(app.apply(Result.ok(add3))(v)),
            );
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        assertEquals(app.apply(app.pure(mul2))(app.pure(x)), app.pure(mul2(x)));
    }

    // interchange
    for (let x = -100; x <= 100; ++x) {
        assertEquals(
            app.apply(Result.ok(mul2))(app.pure(x)),
            app.apply(app.pure((f: (x: number) => number) => f(x)))(
                Result.ok(mul2),
            ),
        );
    }
});

Deno.test("monad laws", () => {
    const m = Result.monad<string>();
    // left identity
    const sqrt = (x: number) =>
        x >= 0
            ? Result.ok(Math.sqrt(x))
            : Result.err("square root of negative is not a number");
    for (let x = -100; x <= 100; ++x) {
        assertEquals(m.flatMap(sqrt)(m.pure(x)), sqrt(x));
    }

    // right identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            assertEquals(m.flatMap(m.pure)(v), v);
        }
    }

    // associativity
    const log = (x: number) =>
        x >= 0
            ? Result.ok(Math.log(x))
            : Result.err("natural logarithm of negative is not a number");
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(x), Result.err(`${x}`)]) {
            m.flatMap(sqrt)(m.flatMap(log)(v)),
                m.flatMap((x: number) => m.flatMap(sqrt)(log(x)))(v);
        }
    }
});

Deno.test("traversable functor laws", () => {
    const tra = Result.traversable<string>();
    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option.Option<T> => 0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    for (const data of [Result.ok("foo"), Result.err("err")]) {
        assertEquals(
            first(tra.traverse(Array.applicative)(dup)(data)),
            tra.traverse(Option.applicative)((item: string) =>
                first(dup(item))
            )(data),
        );
    }

    // identity
    for (let x = -100; x <= 100; ++x) {
        for (const v of [Result.ok(`${x}`), Result.err(`${x}`)]) {
            assertEquals(
                tra.traverse(Identity.applicative)((a: string) => a)(v),
                v,
            );
        }
    }

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [Result.ok("nice"), Result.err("error")]) {
        assertEquals(
            tra.traverse(app)((item: string) => Array.map(firstCh)(dup(item)))(
                x,
            ),
            Array.map(tra.traverse(Option.applicative)(firstCh))(
                tra.traverse(Array.applicative)(dup)(x),
            ),
        );
    }
});

Deno.test("bitraversable functor laws", () => {
    const k = 21;
    const lenOrAnswer = Result.bitraversable.biMap((x: string) => x.length)(
        () => k * 2,
    );
    assertEquals(lenOrAnswer(Result.ok("foo")), Result.ok(42));
    assertEquals(lenOrAnswer(Result.err("bar")), Result.err(3));

    assertEquals(
        Result.bitraversable.bifoldR((msg: string) => (acc: string) =>
            msg + ", " + acc
        )((num: number) => (acc: string) => num.toString() + ", " + acc)("end")(
            Result.ok(2),
        ),
        "2, end",
    );
    assertEquals(
        Result.bitraversable.bifoldR((msg: string) => (acc: string) =>
            msg + ", " + acc
        )((num: number) => (acc: string) => num.toString() + ", " + acc)("end")(
            Result.err("foo"),
        ),
        "foo, end",
    );

    assertEquals(
        Result.bitraversable.bitraverse(Array.applicative)((
            x: string,
        ) => ["ERROR", x])((x: number) => [x, x + 1])(Result.ok(2)),
        [Result.ok(2), Result.ok(3)],
    );
    assertEquals(
        Result.bitraversable.bitraverse(Array.applicative)((
            x: string,
        ) => ["ERROR", x])((x: number) => [x, x + 1])(Result.err("foo")),
        [Result.err("ERROR"), Result.err("foo")],
    );
});

Deno.test("encode then decode", async () => {
    const encoder = Result.enc(encUtf8)(encU32Be);
    const decoder = Result.dec(decUtf8())(decU32Be());
    for (const v of [Result.ok(32), Result.err("failure")]) {
        const code = await runCode(encoder(v));
        const decoded = Result.unwrap(runDecoder(decoder)(code));
        assertEquals(decoded, v);
    }
});

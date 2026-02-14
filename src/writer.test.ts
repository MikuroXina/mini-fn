import { expect, test } from "vitest";
import { cat, doT, doVoidT } from "./cat.js";
import * as Option from "./option.js";
import * as Result from "./result.js";
import type { Monoid } from "./type-class/monoid.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import * as Writer from "./writer.js";

const monoidArray = <T>(): Monoid<T[]> => ({
    identity: [],
    combine: (l, r) => [...l, ...r],
    [semiGroupSymbol]: true,
});

test("tell with tower of hanoi", () => {
    const monad = Writer.monad(monoidArray<[string, string]>());

    const hanoi = (
        height: number,
        from: string,
        to: string,
        another: string,
    ): Writer.Writer<[string, string][], never[]> => {
        if (height < 1) {
            return monad.pure([]);
        }
        if (height === 1) {
            return Writer.tell([[from, to]]);
        }
        return doT(monad)
            .run(hanoi(height - 1, from, another, to))
            .run(Writer.tell([[from, to]]))
            .run(hanoi(height - 1, another, to, from))
            .finish(() => []);
    };

    const res = hanoi(3, "A", "B", "C");
    expect(Writer.executeWriter(res)).toStrictEqual([
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
        ["A", "B"],
        ["C", "A"],
        ["C", "B"],
        ["A", "B"],
    ]);
});

test("listen with collatz sequence", () => {
    const monad = Writer.monad(monoidArray<number>());

    const collatz = (n: number) => {
        if (n % 2 === 0) {
            return n / 2;
        }
        return 3 * n + 1;
    };
    const collatzW = (n: number): Writer.Writer<number[], number> =>
        cat(Writer.tell([n])).feed(Writer.map(() => collatz(n))).value;
    const lengthOfSeq = (
        writer: Writer.Writer<number[], number>,
    ): Writer.Writer<number[], number> =>
        cat(Writer.listen(writer)).feed(
            Writer.map(
                ([_last, numbers]: [number, number[]]) => numbers.length,
            ),
        ).value;
    const collatzSeq = (n: number): Writer.Writer<number[], number> => {
        const seq = (num: number): Writer.Writer<number[], number> =>
            doT(monad)
                .addM("value", collatzW(num))
                .finishM(({ value }) => {
                    if (value === 1) {
                        return monad.pure(1);
                    }
                    return seq(value);
                });
        return lengthOfSeq(seq(n));
    };

    const res = collatzSeq(13);
    expect(Writer.executeWriter(res)).toStrictEqual([
        13, 40, 20, 10, 5, 16, 8, 4, 2,
    ]);
    expect(Writer.evaluateWriter(res)).toStrictEqual(9);
});

test("censor with log decoration", () => {
    const m = Writer.monad(monoidArray<string>());

    const hello = doVoidT(m)
        .run(Writer.tell(["Hello!"]))
        .run(Writer.tell(["What do you do?"])).ctx;
    const log = Writer.censor((messages: string[]) =>
        messages.map((message) => `[LOG] ${message}`),
    )(hello);

    expect(Writer.executeWriter(log)).toStrictEqual([
        "[LOG] Hello!",
        "[LOG] What do you do?",
    ]);
});

test("mapWriter", () => {
    const actual = Writer.mapWriter(([value, state]: [number, number]) => [
        value - 1,
        state + 1,
    ])(() => [0, 5]);

    expect(actual()).toStrictEqual([-1, 6]);
});
test("listens", () => {
    const actual = Writer.listens((state: number) => `${state}`)(() => [4n, 6]);

    expect(actual()).toStrictEqual([[4n, "6"], 6]);
});
test("pass", () => {
    const m = Writer.monad(monoidArray<number>());
    const removeNegative = <A>(
        writer: Writer.Writer<number[], A>,
    ): Writer.Writer<number[], A> =>
        Writer.pass(
            doT(m)
                .addM("a", writer)
                .finish(({ a }) => [a, (log) => log.filter((x) => x >= 0)]),
        );

    const actual = doT(m)
        .run(removeNegative(Writer.tell([4, 2, -3, 0, 5, -1, 6])))
        .finish(() => []);
    expect(actual()).toStrictEqual([[], [4, 2, 0, 5, 6]]);
});
test("product", () => {
    const actual = Writer.product(monoidArray<number>())(() => [
        [1, 4],
        [1, 4],
    ])(() => [
        [2, 3],
        [2, 3],
    ]);

    expect(actual()).toStrictEqual([
        [
            [1, 4],
            [2, 3],
        ],
        [1, 4, 2, 3],
    ]);
});

test("functor laws for Writer", () => {
    const f = Writer.functor<number>();
    // identity
    expect(f.map((x: number) => x)(() => [4, 2])()).toStrictEqual([4, 2]);

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    expect(f.map((x: number) => add3(mul2(x)))(() => [4, 2])()).toStrictEqual(
        f.map(add3)(f.map(mul2)(() => [4, 2]))(),
    );
});
test("applicative functor laws for Writer", () => {
    const a = Writer.applicative(monoidArray<number>());
    // identity
    expect(a.apply(a.pure((i: number) => i))(() => [8, [9]])()).toStrictEqual([
        8,
        [9],
    ]);

    // composition
    const add5: Writer.Writer<number[], (x: number) => number> = () => [
        (x: number) => x + 5,
        [5],
    ];
    const mul3: Writer.Writer<number[], (x: number) => number> = () => [
        (x: number) => x * 3,
        [3],
    ];
    const ultimateAns: Writer.Writer<number[], number> = () => [42, [6, 7]];
    expect(
        a.apply(
            a.apply(
                a.apply(
                    a.pure(
                        (f: (x: number) => number) =>
                            (g: (x: number) => number) =>
                            (i: number) =>
                                f(g(i)),
                    ),
                )(add5),
            )(mul3),
        )(ultimateAns)(),
    ).toStrictEqual(a.apply(add5)(a.apply(mul3)(ultimateAns))());

    // homomorphism
    const toStr = (x: number) => `${x}`;
    expect(a.apply(a.pure(toStr))(a.pure(19))()).toStrictEqual(
        a.pure(toStr(19))(),
    );

    // interchange
    expect(a.apply(add5)(a.pure(17))()).toStrictEqual(
        a.apply(a.pure((i: (x: number) => number) => i(17)))(add5)(),
    );
});
test("monad laws for Writer", () => {
    const m = Writer.monad(monoidArray<number>());
    // left identity
    const toStrAndLog =
        (x: number): Writer.Writer<number[], string> =>
        () => [`${x}`, [x]];
    expect(m.flatMap(toStrAndLog)(m.pure(42))()).toStrictEqual(
        toStrAndLog(42)(),
    );

    // right identity
    const foo: Writer.Writer<number[], string> = () => ["foo", [6]];
    expect(m.flatMap(m.pure)(foo)()).toStrictEqual(foo());

    // associativity
    const lenAndLog =
        (x: string): Writer.Writer<number[], number> =>
        () => [x.length, [x.length]];
    expect(m.flatMap(toStrAndLog)(m.flatMap(lenAndLog)(foo))()).toStrictEqual(
        m.flatMap((x: string) => m.flatMap(toStrAndLog)(lenAndLog(x)))(foo)(),
    );
});

test("mapWriterT", () => {
    const actual = Writer.mapWriterT<
        Option.OptionHkt,
        Result.ResultErrorHkt,
        number,
        string,
        number,
        string
    >(
        (
            maw: Option.Option<[number, number]>,
        ): Result.Result<Error, [string, string]> =>
            Option.mapOr<Result.Result<Error, [string, string]>>(
                Result.err(new Error("none error")),
            )(([value, state]: [number, number]) =>
                Result.ok<[string, string]>([`${value}`, `${state}`]),
            )(maw),
    )(() => Option.some([14, 23]));

    expect(actual()).toStrictEqual(Result.ok(["14", "23"]));
});
test("tellM", () => {
    const actual = Writer.tellM(Option.monad);

    expect(actual(42)()).toStrictEqual(Option.some([[], 42]));
});
test("listenM", () => {
    const actual = Writer.listenM(Option.monad)(() =>
        Option.some<[string, string]>(["foo", "bar"]),
    );

    expect(actual()).toStrictEqual(Option.some([["foo", "bar"], "bar"]));
});
test("listensM", () => {
    const actual = Writer.listensM(Option.monad)((x: number) => `${x}`)(() =>
        Option.some(["baz", 42]),
    );

    expect(actual()).toStrictEqual(Option.some([["baz", "42"], 42]));
});

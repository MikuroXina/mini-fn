import { expect, test } from "vitest";
import { Option, Result } from "../mod.js";
import { cat, doT } from "./cat.js";
import * as State from "./state.js";

const xorShiftRng: State.State<number, number> = (
    state: number,
): [number, number] => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return [state, state];
};

test("roll three dices", () => {
    const seed = 1423523;

    const takeThree = doT(State.monad<number>())
        .addM("result1", xorShiftRng)
        .addM("result2", xorShiftRng)
        .addM("result3", xorShiftRng)
        .finish((ctx) => ctx);
    const results = State.evaluateState(takeThree)(seed);
    expect(results).toStrictEqual({
        result1: 1463707459,
        result2: -519004248,
        result3: -1370047078,
    });
});

test("twenty times", () => {
    const twentyTimes = (x: number): number =>
        State.evaluateState(
            doT(State.monad<number>())
                .run(State.put(x + x))
                .addM("x2", State.get<number>())
                .addWith("x4", ({ x2 }) => x2 + x2)
                .addWith("x8", ({ x4 }) => x4 + x4)
                .addWith("x10", ({ x2, x8 }) => x2 + x8)
                .finish(({ x10 }) => x10 + x10),
        )(0);

    expect(twentyTimes(10)).toStrictEqual(200);
});

test("executeState", () => {
    expect(
        cat(xorShiftRng)
            .feed(State.map((x: number) => x * 2))
            .feed(State.executeState)
            .value(1423523),
    ).toStrictEqual(1463707459);
});
test("mapState", () => {
    expect(
        cat(xorShiftRng)
            .feed(
                State.mapState(([value, state]: [number, number]) => [
                    `${value}`,
                    state + 1,
                ]),
            )
            .feed(State.runState)
            .value(1423523),
    ).toStrictEqual(["1463707459", 1463707460]);
});
test("withState", () => {
    expect(
        cat(xorShiftRng)
            .feed(State.withState((state: number) => state * 2))
            .feed(State.runState)
            .value(1423523),
    ).toStrictEqual([-1368174937, -1368174937]);
});
test("product", () => {
    const actual = State.product(
        State.withState((state: number) => state * 2)(xorShiftRng),
    )(State.withState((state: number) => state - 2)(xorShiftRng));

    expect(State.runState(actual)(1423523)).toStrictEqual([
        [-1368174937, 861512630],
        861512630,
    ]);
});
test("flatten", () => {
    const actual = State.flatten((state1: number) => [
        (state2: number) => [state1 + state2, state2] as [number, number],
        state1,
    ]);

    expect(State.runState(actual)(1423523)).toStrictEqual([2847046, 1423523]);
});

test("functor laws for State", () => {
    const f = State.functor<number>();
    // identity
    const seed = 1423523;
    expect(f.map((x: number) => x)(xorShiftRng)(seed)).toStrictEqual(
        xorShiftRng(seed),
    );

    // composition
    const normZeroToOne = (x: number) => Math.abs(x / (1 << 31));
    const mul2 = (x: number) => x * 2;
    expect(
        f.map((x: number) => mul2(normZeroToOne(x)))(xorShiftRng)(seed),
    ).toStrictEqual(f.map(mul2)(f.map(normZeroToOne)(xorShiftRng))(seed));
});
test("applicative functor laws for State", () => {
    const a = State.applicative<number>();
    // identity
    const seed = 1423523;
    expect(a.apply(a.pure((i: number) => i))(xorShiftRng)(seed)).toStrictEqual(
        xorShiftRng(seed),
    );

    // composition
    const add = (state: number): [(x: number) => number, number] => [
        (x: number) => x + state,
        state,
    ];
    const mul = (state: number): [(x: number) => number, number] => [
        (x: number) => x * state,
        state,
    ];
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
                )(add),
            )(mul),
        )(xorShiftRng)(seed),
    ).toStrictEqual(a.apply(add)(a.apply(mul)(xorShiftRng))(seed));

    // homomorphism
    const add2 = (x: number) => x + 2;
    expect(a.apply(a.pure(add2))(a.pure(42))(seed)).toStrictEqual(
        a.pure(add2(42))(seed),
    );

    // interchange
    expect(a.apply(mul)(a.pure(42))(seed)).toStrictEqual(
        a.apply(a.pure((i: (x: number) => number) => i(42)))(mul)(seed),
    );
});
test("monad laws for State", () => {
    const m = State.monad<number>();
    // left identity
    const addSub =
        (x: number) =>
        (state: number): [number, number] => [x + state, x - state];
    const code = 1423523;
    const seed = 42;
    expect(m.flatMap(addSub)(m.pure(code))(seed)).toStrictEqual(
        addSub(code)(seed),
    );

    // right identity
    expect(m.flatMap(m.pure)(xorShiftRng)(seed)).toStrictEqual(
        xorShiftRng(seed),
    );

    // associativity
    const mulDiv =
        (x: number) =>
        (state: number): [number, number] => [x * state, x / state];
    expect(
        m.flatMap(addSub)(m.flatMap(mulDiv)(xorShiftRng))(seed),
    ).toStrictEqual(
        m.flatMap((x: number) => m.flatMap(addSub)(mulDiv(x)))(xorShiftRng)(
            seed,
        ),
    );
});

test("runStateT", () => {
    const sqrt: State.StateT<number, Result.ResultErrorHkt, number> = (
        state: number,
    ): Result.Result<Error, [number, number]> =>
        state >= 0
            ? Result.ok<[number, number]>([Math.sqrt(state), state])
            : Result.err(new Error("state must be positive"));

    expect(State.runStateT(sqrt)(9)).toStrictEqual(Result.ok([3, 9]));
    expect(State.runStateT(sqrt)(-1)).toStrictEqual(
        Result.err(new Error("state must be positive")),
    );
});

type Parser<T> = State.StateT<string, Result.ResultErrorHkt, T>;
const parserMonad = State.monadT<string, Result.ResultErrorHkt>(
    Result.monad<Error>(),
);

const literal =
    (lit: string): Parser<never[]> =>
    (source: string) =>
        source.startsWith(lit)
            ? Result.ok<[never[], string]>([[], source.slice(lit.length)])
            : Result.err(new Error(`unmatched to literal ${lit}`));
const takeWhile =
    (pred: (ch: string) => boolean): Parser<string> =>
    (source: string) => {
        let buf = "";
        for (const ch of source) {
            if (!pred(ch)) {
                break;
            }
            buf += ch;
        }
        return Result.ok<[string, string]>([buf, source.slice(buf.length)]);
    };
const alt =
    <T>(...choices: Parser<T>[]): Parser<T> =>
    (source: string) => {
        for (const choice of choices) {
            const res = choice(source);
            if (Result.isOk(res)) {
                return res;
            }
        }
        return Result.err(new Error("`alt` must match least one parser"));
    };

const alpha0 = takeWhile((ch) => /[A-Za-z]/g.test(ch));

type Tree = [entry: string] | [left: Tree, right: Tree];
const parseTree: Parser<Tree> = alt(
    doT(parserMonad)
        .addM("_", literal("("))
        .addMWith("left", () => parseTree)
        .addM("_", literal(","))
        .addMWith("right", () => parseTree)
        .addM("_", literal(")"))
        .finish(({ left, right }): Tree => [left, right]),
    parserMonad.map((entry: string): Tree => [entry])(alpha0),
);

test("evaluateStateT", () => {
    expect(
        State.evaluateStateT(Result.monad<Error>())(parseTree)("(foo,bar)"),
    ).toStrictEqual(Result.ok([["foo"], ["bar"]]));
});
test("executeStateT", () => {
    expect(
        State.executeStateT(Result.monad<Error>())(parseTree)("(foo,bar)"),
    ).toStrictEqual(Result.ok(""));
});

const sqrt: State.StateT<number, Option.OptionHkt, number> = (
    state: number,
): Option.Option<[number, number]> =>
    state >= 0
        ? Option.some<[number, number]>([Math.sqrt(state), state])
        : Option.none();

test("mapStateT", () => {
    const toStr = State.mapStateT<
        Option.OptionHkt,
        Result.ResultErrorHkt,
        number,
        number,
        string
    >((m: Option.Option<[number, number]>) =>
        Option.mapOr<Result.Result<Error, [string, number]>>(
            Result.err(new Error("none")),
        )(([value, state]: [number, number]) =>
            Result.ok<[string, number]>([`${value}`, state]),
        )(m),
    )(sqrt);

    expect(toStr(9)).toStrictEqual(Result.ok(["3", 9]));
    expect(toStr(-1)).toStrictEqual(Result.err(new Error("none")));
});
test("withStateT", () => {
    const add1 = State.withStateT((state: number) => state + 1)(sqrt);

    expect(add1(8)).toStrictEqual(Option.some([3, 9]));
    expect(add1(-2)).toStrictEqual(Option.none());
});
test("productT", () => {
    const log10: State.StateT<number, Option.OptionHkt, number> = (
        state: number,
    ): Option.Option<[number, number]> =>
        state > 0 && state !== 1
            ? Option.some<[number, number]>([Math.log10(state), state])
            : Option.none();
    const sqrtAndLog10 = State.productT(Option.monad)(sqrt)(log10);

    expect(sqrtAndLog10(100)).toStrictEqual(Option.some([[10, 2], 100]));
});

test("functor laws for StateT", () => {
    const f = State.functorT<number, Option.OptionHkt>(Option.functor);
    // identity
    const seed = 1423523;
    expect(f.map((x: number) => x)(sqrt)(seed)).toStrictEqual(sqrt(seed));

    // composition
    const normZeroToOne = (x: number) => Math.abs(x / (1 << 31));
    const mul2 = (x: number) => x * 2;
    expect(
        f.map((x: number) => mul2(normZeroToOne(x)))(sqrt)(seed),
    ).toStrictEqual(f.map(mul2)(f.map(normZeroToOne)(sqrt))(seed));
});
test("applicative functor laws for StateT", () => {
    const a = State.applicativeT<number, Option.OptionHkt>(Option.monad);
    // identity
    const seed = 1423523;
    expect(a.apply(a.pure((i: number) => i))(sqrt)(seed)).toStrictEqual(
        sqrt(seed),
    );

    // composition
    const log10: State.StateT<
        number,
        Option.OptionHkt,
        (x: number) => number
    > = (state: number): Option.Option<[(x: number) => number, number]> =>
        state > 0 && state !== 1
            ? Option.some<[(x: number) => number, number]>([Math.log10, state])
            : Option.none();
    const log1p: State.StateT<
        number,
        Option.OptionHkt,
        (x: number) => number
    > = (state: number): Option.Option<[(x: number) => number, number]> =>
        state <= -1
            ? Option.some<[(x: number) => number, number]>([Math.log1p, state])
            : Option.none();
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
                )(log10),
            )(log1p),
        )(sqrt)(seed),
    ).toStrictEqual(a.apply(log10)(a.apply(log1p)(sqrt))(seed));

    // homomorphism
    const add2 = (x: number) => x + 2;
    expect(a.apply(a.pure(add2))(a.pure(42))(seed)).toStrictEqual(
        a.pure(add2(42))(seed),
    );

    // interchange
    expect(a.apply(log1p)(a.pure(42))(seed)).toStrictEqual(
        a.apply(a.pure((i: (x: number) => number) => i(42)))(log1p)(seed),
    );
});
test("monad laws for StateT", () => {
    const m = State.monadT<number, Option.OptionHkt>(Option.monad);
    // left identity
    const addSub =
        (x: number) =>
        (state: number): Option.Option<[number, number]> =>
            x !== state ? Option.some([x + state, x - state]) : Option.none();
    const code = 1423523;
    const seed = 42;
    expect(m.flatMap(addSub)(m.pure(code))(seed)).toStrictEqual(
        addSub(code)(seed),
    );

    // right identity
    expect(m.flatMap(m.pure)(sqrt)(seed)).toStrictEqual(sqrt(seed));

    // associativity
    const mulDiv =
        (x: number) =>
        (state: number): Option.Option<[number, number]> =>
            state !== 0 ? Option.some([x * state, x / state]) : Option.none();
    expect(m.flatMap(addSub)(m.flatMap(mulDiv)(sqrt))(seed)).toStrictEqual(
        m.flatMap((x: number) => m.flatMap(addSub)(mulDiv(x)))(sqrt)(seed),
    );
});

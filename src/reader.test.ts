import { expect, test } from "vitest";
import { type ArrayHkt, monad as arrayMonad } from "./array.js";
import { doT } from "./cat.js";
import { mapOr, none, type Option, type OptionHkt, some } from "./option.js";
import * as Reader from "./reader.js";

test("ask", () => {
    interface User {
        name: string;
    }
    const userCat = doT(Reader.monad<User>());

    const message = (): Reader.Reader<User, string> =>
        userCat
            .addM("user", Reader.ask<User>())
            .finish(({ user: { name } }) => `Hello, ${name}!`);
    const box = (): Reader.Reader<User, string> =>
        userCat
            .addM("mes", message())
            .finish(({ mes }) => `<div class="message-box">${mes}</div>`);

    expect(Reader.run(box())({ name: "John" })).toStrictEqual(
        '<div class="message-box">Hello, John!</div>',
    );
    expect(Reader.run(box())({ name: "Alice" })).toStrictEqual(
        '<div class="message-box">Hello, Alice!</div>',
    );
});

test("local", () => {
    interface User {
        name: string;
        id: string;
        score: number;
    }
    interface Bulk {
        users: readonly User[];
    }

    const extractFromBulk = (id: string) =>
        Reader.local((bulk: Bulk): Option<User> => {
            const found = bulk.users.find((elem) => elem.id === id);
            if (!found) {
                return none();
            }
            return some(found);
        });
    const scoreReport = (id: string): Reader.Reader<Bulk, string> =>
        extractFromBulk(id)(
            doT(Reader.monad<Option<User>>())
                .addM("user", Reader.ask<Option<User>>())
                .finish(({ user }) =>
                    mapOr("user not found")(
                        ({ name, score }: User) =>
                            `${name}'s score is ${score}!`,
                    )(user),
                ),
        );

    const bulk: Bulk = {
        users: [
            { name: "John", id: "1321", score: 12130 },
            { name: "Alice", id: "4209", score: 320123 },
        ],
    };
    expect(Reader.run(scoreReport("1321"))(bulk)).toStrictEqual(
        "John's score is 12130!",
    );
    expect(Reader.run(scoreReport("4209"))(bulk)).toStrictEqual(
        "Alice's score is 320123!",
    );
});

test("product", () => {
    interface Config {
        configA: string;
        configB: number;
    }
    const actual = Reader.product(
        Reader.withReader(({ configA }: Config) => configA),
    )(Reader.withReader(({ configB }: Config) => configB))({
        configA: "foo",
        configB: 42,
    });

    expect(actual).toStrictEqual(["foo", 42]);
});

test("applyWeak", () => {
    interface Clock {
        now: () => number;
    }
    interface Adaptors extends Clock {
        otherEnv: string;
    }
    const actual = Reader.applyWeak(Reader.withReader(({ now }: Clock) => now))(
        Reader.withReader(({ now }: Adaptors) => ({ now })),
    )({ now: () => Date.UTC(2020), otherEnv: "production" });

    expect(actual).toStrictEqual(Date.UTC(2020));
});
test("flatMapWeak", () => {
    interface User {
        name: string;
    }
    interface UserQuery {
        fetchUser: (id: string) => User;
    }
    interface Req {
        params: { id: string };
    }
    const actual = Reader.flatMapWeak((id: string) =>
        Reader.withReader(({ fetchUser }: UserQuery) => fetchUser(id)),
    )(Reader.withReader(({ params: { id } }: Req) => id))({
        fetchUser: (id) => ({ name: `John ${id}` }),
        params: { id: "01" },
    });

    expect(actual).toStrictEqual({
        name: "John 01",
    });
});
test("flattenWeak", () => {
    interface ConfigA {
        configA: string;
    }
    interface ConfigB {
        configB: number;
    }
    const actual = Reader.flattenWeak(
        Reader.withReader(({ configA }: ConfigA) =>
            Reader.withReader(
                ({ configB }: ConfigB) => `${configA} ${configB}`,
            ),
        ),
    )({ configA: "Half-Life", configB: 3 });

    expect(actual).toStrictEqual("Half-Life 3");
});

test("weaken", () => {
    interface LocalConfig {
        switchA: string;
    }
    interface GlobalConfig extends LocalConfig {
        mode: string;
    }
    const actual = Reader.weaken<GlobalConfig>()(
        Reader.withReader(({ switchA }: LocalConfig) => `${switchA} used`),
    )({
        mode: "production",
        switchA: "firefox",
    });

    expect(actual).toStrictEqual("firefox used");
});
test("compose", () => {
    for (let x = -10; x <= 10; ++x) {
        const actual = Reader.compose(Reader.withReader((x: number) => x * 2))(
            Reader.withReader((x: number) => x + 3),
        )(x);
        expect(actual).toStrictEqual(2 * x + 3);
    }
});
test("diMap", () => {
    interface Config {
        configA: string;
        configB: string;
    }
    const actual = Reader.diMap(({ configA }: Config) => configA)((x: string) =>
        parseInt(x, 10),
    )(Reader.withReader((x: string) => `${x}0`))({
        configA: "32",
        configB: "banana",
    });

    expect(actual).toStrictEqual(320);
});

test("functor laws for Reader", () => {
    const f = Reader.functor<string>();
    // identity
    const toInt = Reader.withReader((s: string) => parseInt(s, 10));
    expect(f.map((x: number) => x)(toInt)("42")).toStrictEqual(toInt("42"));

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    expect(f.map((x: number) => add3(mul2(x)))(toInt)("42")).toStrictEqual(
        f.map(add3)(f.map(mul2)(toInt))("42"),
    );
});
test("applicative functor laws for Reader", () => {
    const a = Reader.applicative<string>();
    // identity
    // For all `x`; `a.apply(a.pure((i) => i))(x)` equals to `x`,
    const toInt = Reader.withReader((s: string) => parseInt(s, 10));
    expect(a.apply(a.pure((i: number) => i))(toInt)("42")).toStrictEqual(
        toInt("42"),
    );

    // composition
    const add3 = Reader.pure((x: number) => x + 3);
    const mul2 = Reader.pure((x: number) => x * 2);
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
                )(add3),
            )(mul2),
        )(toInt)("42"),
    ).toStrictEqual(a.apply(add3)(a.apply(mul2)(toInt))("42"));

    // homomorphism
    const sq = (x: number) => x * x;
    const three = 3;
    expect(a.apply(a.pure(sq))(a.pure(three))("42")).toStrictEqual(
        a.pure(sq(three))("42"),
    );

    // interchange
    expect(a.apply(mul2)(a.pure(three))("42")).toStrictEqual(
        a.apply(a.pure((i: (x: number) => number) => i(three)))(mul2)("42"),
    );
});
test("monad laws for Reader", () => {
    const m = Reader.monad<string>();
    // left identity
    const tagged = (mes: string) =>
        Reader.withReader((tag) => `${tag}: ${mes}`);
    const hello = "hello";
    expect(m.flatMap(tagged)(m.pure(hello))("42")).toStrictEqual(
        tagged(hello)("42"),
    );

    // right identity
    const len = Reader.withReader((x: string) => x.length);
    expect(m.flatMap(m.pure)(len)("42")).toStrictEqual(len("42"));

    // associativity
    const enclosed = (depth: number) =>
        Reader.withReader(
            (tag) => `${"[".repeat(depth)}${tag}${"]".repeat(depth)}`,
        );
    expect(m.flatMap(tagged)(m.flatMap(enclosed)(len))("42")).toStrictEqual(
        m.flatMap((x: number) => m.flatMap(tagged)(enclosed(x)))(len)("42"),
    );
});

test("mapReaderT", () => {
    const toInt: (opt: Option<string>) => number[] = mapOr([] as number[])(
        (x: string) => [parseInt(x, 10)],
    );
    const actual = Reader.mapReaderT<OptionHkt, ArrayHkt, string, number>(
        toInt,
    )((x: string): Option<string> => (/^\d+$/g.test(x) ? some(x) : none()))(
        "42",
    );

    expect(actual).toStrictEqual([42]);
});
test("withReaderT", () => {
    interface Config {
        port: string;
    }
    const toInt = (x: string): Option<number> =>
        /^\d+$/g.test(x) ? some(parseInt(x, 10)) : none();
    const actual = Reader.withReaderT(({ port }: Config) => port)<
        OptionHkt,
        number
    >(toInt)({ port: "2434" });
    expect(actual).toStrictEqual(some(2434));
});

test("functor laws for ReaderT", () => {
    const f = Reader.functorT<string, ArrayHkt>(arrayMonad);
    // identity
    const singleton = (x: string) => [x];
    expect(f.map((x: string) => x)(singleton)("42")).toStrictEqual(
        singleton("42"),
    );

    // composition
    const question = (x: string) => `${x}?`;
    const bang = (x: string) => `${x}!`;
    expect(
        f.map((x: string) => question(bang(x)))(singleton)("42"),
    ).toStrictEqual(f.map(question)(f.map(bang)(singleton))("42"));
});
test("applicative functor laws for ReaderT", () => {
    const a = Reader.applicativeT<number, ArrayHkt>(arrayMonad);
    // identity
    const singleton = (x: number) => [x];
    expect(a.apply(a.pure((i: number) => i))(singleton)(42)).toStrictEqual(
        singleton(42),
    );

    // composition
    const mul2N = (x: number) => [() => x * 2, (n: number) => x * n];
    const add2N = (x: number) => [() => x + 2, (n: number) => x + n];
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
                )(mul2N),
            )(add2N),
        )(singleton)(42),
    ).toStrictEqual(a.apply(mul2N)(a.apply(add2N)(singleton))(42));

    // homomorphism
    const dir = (s: string) => `{ s: ${s} }`;
    const hello = "hello";
    expect(a.apply(a.pure(dir))(a.pure(hello))(42)).toStrictEqual(
        a.pure(dir(hello))(42),
    );

    // interchange
    for (let x = -10; x <= 10; ++x) {
        expect(a.apply(mul2N)(a.pure(x))(42)).toStrictEqual(
            a.apply(a.pure((f: (x: number) => number) => f(x)))(mul2N)(42),
        );
    }
});
test("monad laws for ReaderT", () => {
    const m = Reader.monadT<string, ArrayHkt>(arrayMonad);
    // left identity
    const addPlus =
        (n: number): Reader.ReaderT<string, ArrayHkt, string> =>
        (x: string) =>
            [...x].map((c) => `${c} + ${n}`);
    expect(m.flatMap(addPlus)(m.pure(8000))("42")).toStrictEqual(
        addPlus(8000)("42"),
    );

    // right identity
    const split = (x: string) => [...x];
    expect(m.flatMap(m.pure)(split)("42")).toStrictEqual(split("42"));

    // associativity
    const subDigits =
        (n: number): Reader.ReaderT<string, ArrayHkt, number> =>
        (x: string) =>
            [...x].map((c) => parseInt(c, 10) - n);
    const decHex = (x: string) => [parseInt(x, 10), parseInt(x, 16)];
    expect(
        m.flatMap(addPlus)(m.flatMap(subDigits)(decHex))("42"),
    ).toStrictEqual(
        m.flatMap((x: number) => m.flatMap(addPlus)(subDigits(x)))(decHex)(
            "42",
        ),
    );
});

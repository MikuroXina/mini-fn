import { expect, test } from "vitest";
import { Array, Compose } from "../mod.js";
import {
    applicative,
    apply,
    biMap,
    breakValue,
    type ControlFlow,
    continueValue,
    dec,
    enc,
    eq,
    flatten,
    foldR,
    functor,
    isBreak,
    isContinue,
    mapBreak,
    mapContinue,
    monad,
    newBreak,
    newContinue,
    partialEqUnary,
    traversable,
    traversableMonad,
} from "./control-flow.js";
import { applicative as applicativeIdentity } from "./identity.js";
import {
    applicative as applicativeOption,
    none,
    type Option,
    some,
} from "./option.js";
import { unwrap } from "./result.js";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.js";
import { eqSymbol, stringEq } from "./type-class/eq.js";

const cases = [newContinue("foo"), newBreak("bar")] as const;

test("type assertion", () => {
    const actual = cases.map((c: ControlFlow<string, string>) => [
        isContinue(c),
        isBreak(c),
    ]);
    expect(actual).toStrictEqual([
        [true, false],
        [false, true],
    ]);
});

test("extract", () => {
    const actual = cases.map((c) => [continueValue(c), breakValue(c)]);
    expect(actual).toStrictEqual([
        [some("foo"), none()],
        [none(), some("bar")],
    ]);
});

test("equality", () => {
    const equality = eq(
        {
            eq: (l: bigint, r: bigint) => l === r,
            [eqSymbol]: true,
        },
        stringEq,
    );
    // symmetric
    for (let x = -100n; x <= 100n; ++x) {
        for (const y of ["foo", "bar", "", "hoge"]) {
            expect(equality.eq(newBreak(x), newBreak(x))).toStrictEqual(true);
            expect(equality.eq(newContinue(y), newContinue(y))).toStrictEqual(
                true,
            );
            expect(equality.eq(newBreak(x), newContinue(y))).toStrictEqual(
                false,
            );
            expect(equality.eq(newContinue(y), newBreak(x))).toStrictEqual(
                false,
            );
        }
    }

    // transitive
    for (let x = -100n; x <= 100n; ++x) {
        for (const y of ["foo", "bar", "", "hoge"]) {
            for (let z = -200n; z <= 200n; ++z) {
                expect(
                    equality.eq(newBreak(x), newContinue(y)) &&
                        equality.eq(newContinue(y), newBreak(z)),
                ).toStrictEqual(false);
                expect(
                    equality.eq(newContinue(y), newBreak(x)) &&
                        equality.eq(newBreak(x), newBreak(z)),
                ).toStrictEqual(false);
            }
        }
    }
});

test("partial equality unary", () => {
    const equalityUnary = partialEqUnary(stringEq);
    const equality = equalityUnary.liftEq((l: bigint, r: bigint) => l === r);

    // symmetric
    for (const x of ["foo", "bar", "", "hoge"]) {
        for (let y = -100n; y <= 100n; ++y) {
            expect(equality(newBreak(x), newBreak(x))).toStrictEqual(true);
            expect(equality(newContinue(y), newContinue(y))).toStrictEqual(
                true,
            );
            expect(equality(newBreak(x), newContinue(y))).toStrictEqual(false);
            expect(equality(newContinue(y), newBreak(x))).toStrictEqual(false);
        }
    }

    // transitive
    for (const x of ["foo", "bar", "", "hoge"]) {
        for (let y = -100n; y <= 100n; ++y) {
            for (let z = -200n; z <= 200n; ++z) {
                expect(
                    equality(newBreak(x), newContinue(y)) &&
                        equality(newContinue(y), newContinue(z)),
                ).toStrictEqual(false);
                expect(
                    equality(newContinue(y), newBreak(x)) &&
                        equality(newBreak(x), newContinue(z)),
                ).toStrictEqual(false);
            }
        }
    }
});

test("map", () => {
    const actual = cases.map((c) => [
        mapContinue((x: string) => x.toUpperCase())(c),
        mapBreak((x: string) => x.toUpperCase())(c),
    ]);
    expect(actual).toStrictEqual([
        [newContinue("FOO"), newContinue("foo")],
        [newBreak("bar"), newBreak("BAR")],
    ]);
});

test("apply", () => {
    const mapper = newContinue((x: string) => `${x}!`) as ControlFlow<
        never[],
        (x: string) => string
    >;
    expect(apply(mapper)(newContinue("foo"))).toStrictEqual(
        newContinue("foo!"),
    );
    expect(apply(mapper)(newBreak([]))).toStrictEqual(newBreak([]));
    expect(apply(newBreak([]))(newContinue("foo"))).toStrictEqual(newBreak([]));
    expect(apply(newBreak([]))(newBreak([]))).toStrictEqual(newBreak([]));
});

test("biMap", () => {
    const actual = cases.map(
        biMap((x: string) => `${x}!`)((x: string) => `${x}?`),
    );
    expect(actual).toStrictEqual([newContinue("foo?"), newBreak("bar!")]);
});

test("flatten", () => {
    expect(flatten(newBreak("hoge"))).toStrictEqual(newBreak("hoge"));
    expect(flatten(newContinue(newBreak("foo")))).toStrictEqual(
        newBreak("foo"),
    );
    expect(flatten(newContinue(newContinue("bar")))).toStrictEqual(
        newContinue("bar"),
    );
});

test("functor laws", () => {
    const f = functor<never[]>();
    const data = newContinue(2);
    // identity
    expect(f.map((x: number) => x)(data)).toStrictEqual(data);

    // composition
    const add = (x: number) => x + 3;
    const mul = (x: number) => x * 2;
    expect(f.map((x: number) => mul(add(x)))(data)).toStrictEqual(
        f.map(mul)(f.map(add)(data)),
    );
});

test("applicative laws", () => {
    const a = applicative<string>();
    const strLen = a.pure((x: string) => x.length);
    const question = a.pure((x: string) => `${x}?`);

    for (const data of cases) {
        // identity
        expect(apply(a.pure((x: string) => x))(data)).toStrictEqual(data);

        // composition
        expect(
            apply(
                apply(
                    apply(
                        a.pure(
                            (f: (x: string) => number) =>
                                (g: (x: string) => string) =>
                                (i: string) =>
                                    f(g(i)),
                        ),
                    )(strLen),
                )(question),
            )(data),
        ).toStrictEqual(apply(strLen)(apply(question)(data)));
    }

    // homomorphism
    expect(apply(a.pure((x: string) => `${x}!`))(a.pure("foo"))).toStrictEqual(
        a.pure("foo!"),
    );

    // interchange
    expect(apply(strLen)(a.pure("boo"))).toStrictEqual(
        apply(a.pure((f: (x: string) => number) => f("boo")))(strLen),
    );
});

test("monad laws", () => {
    const m = monad<number>();
    const continuing = (x: string): ControlFlow<number, string> =>
        newContinue(x);
    const breaking = (x: string): ControlFlow<number, string> =>
        newBreak(x.length);
    const cases = [continuing, breaking];

    // left identity
    for (const c of cases) {
        expect(m.flatMap(c)(m.pure("baz"))).toStrictEqual(c("baz"));
    }

    // right identity
    expect(m.flatMap(m.pure)(newContinue("a"))).toStrictEqual(newContinue("a"));
    expect(m.flatMap(m.pure)(newBreak(2))).toStrictEqual(newBreak(2));

    // associativity
    for (const data of [newContinue("a"), newBreak(2)]) {
        expect(m.flatMap(breaking)(m.flatMap(continuing)(data))).toStrictEqual(
            m.flatMap((x: string) => m.flatMap(breaking)(continuing(x)))(data),
        );
        expect(m.flatMap(continuing)(m.flatMap(breaking)(data))).toStrictEqual(
            m.flatMap((x: string) => m.flatMap(continuing)(breaking(x)))(data),
        );
    }
});

test("foldR", () => {
    {
        const actual = foldR((next: string) => (acc: string) => next + acc)("")(
            cases[0],
        );
        expect(actual).toStrictEqual("foo");
    }
    {
        const actual = foldR((next: string) => (acc: string) => next + acc)("")(
            cases[1],
        );
        expect(actual).toStrictEqual("");
    }
});

test("traversable laws", () => {
    const t = traversable<string>();
    // naturality
    const first = <T>(x: readonly T[]): Option<T> =>
        0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [`${x}0`, `${x}1`];
    const data = newContinue("fever");
    expect(first(t.traverse(Array.applicative)(dup)(data))).toStrictEqual(
        t.traverse(applicativeOption)((item: string) => first(dup(item)))(data),
    );

    // identity
    for (const c of cases) {
        expect(
            t.traverse(applicativeIdentity)((x: string) => x)(c),
        ).toStrictEqual(c);
    }

    // composition
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    expect(
        t.traverse(Compose.applicative(Array.applicative)(applicativeOption))(
            (x: string) => Array.map(firstCh)(dup(x)),
        )(data),
    ).toStrictEqual(
        Array.map(t.traverse(applicativeOption)(firstCh))(
            t.traverse(Array.applicative)(dup)(data),
        ),
    );
});

test("traversable monad laws", () => {
    const t = traversableMonad<number>();

    const continuing = (x: string): ControlFlow<number, string> =>
        newContinue(x);
    const breaking = (x: string): ControlFlow<number, string> =>
        newBreak(x.length);

    // left identity
    for (const c of [continuing, breaking]) {
        expect(t.flatMap(c)(t.pure("baz"))).toStrictEqual(c("baz"));
    }

    // right identity
    expect(t.flatMap(t.pure)(newContinue("a"))).toStrictEqual(newContinue("a"));
    expect(t.flatMap(t.pure)(newBreak(2))).toStrictEqual(newBreak(2));

    // associativity
    for (const data of [newContinue("a"), newBreak(2)]) {
        expect(t.flatMap(breaking)(t.flatMap(continuing)(data))).toStrictEqual(
            t.flatMap((x: string) => t.flatMap(breaking)(continuing(x)))(data),
        );
        expect(t.flatMap(continuing)(t.flatMap(breaking)(data))).toStrictEqual(
            t.flatMap((x: string) => t.flatMap(continuing)(breaking(x)))(data),
        );
    }

    // naturality
    const first = <T>(x: readonly T[]): Option<T> =>
        0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [`${x}0`, `${x}1`];
    const data = newContinue("fever");
    expect(first(t.traverse(Array.applicative)(dup)(data))).toStrictEqual(
        t.traverse(applicativeOption)((item: string) => first(dup(item)))(data),
    );

    // identity
    for (const c of [newContinue("foo"), newBreak(6)]) {
        expect(
            t.traverse(applicativeIdentity)((x: string) => x)(c),
        ).toStrictEqual(c);
    }

    // composition
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    expect(
        t.traverse(Compose.applicative(Array.applicative)(applicativeOption))(
            (x: string) => Array.map(firstCh)(dup(x)),
        )(data),
    ).toStrictEqual(
        Array.map(t.traverse(applicativeOption)(firstCh))(
            t.traverse(Array.applicative)(dup)(data),
        ),
    );
});

test("encode then decode", () => {
    const data: readonly ControlFlow<string, number>[] = [
        newContinue(42),
        newBreak("foo"),
    ];
    for (const datum of data) {
        const code = runCode(enc(encUtf8)(encU32Be)(datum));
        const decoded = unwrap(runDecoder(dec(decUtf8())(decU32Be()))(code));
        expect(datum).toStrictEqual(decoded);
    }
});

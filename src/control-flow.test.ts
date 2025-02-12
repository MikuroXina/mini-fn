import { assertEquals } from "../deps.ts";
import { Array, Compose } from "../mod.ts";
import {
    applicative,
    apply,
    biMap,
    breakValue,
    continueValue,
    type ControlFlow,
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
} from "./control-flow.ts";
import { applicative as applicativeIdentity } from "./identity.ts";
import {
    applicative as applicativeOption,
    none,
    type Option,
    some,
} from "./option.ts";
import { unwrap } from "./result.ts";
import {
    decU32Be,
    decUtf8,
    encU32Be,
    encUtf8,
    runCode,
    runDecoder,
} from "./serial.ts";
import { eqSymbol, stringEq } from "./type-class/eq.ts";

const cases = [newContinue("foo"), newBreak("bar")] as const;

Deno.test("type assertion", () => {
    const actual = cases.map((
        c: ControlFlow<string, string>,
    ) => [isContinue(c), isBreak(c)]);
    assertEquals(actual, [[true, false], [false, true]]);
});

Deno.test("extract", () => {
    const actual = cases.map((c) => [continueValue(c), breakValue(c)]);
    assertEquals(actual, [
        [some("foo"), none()],
        [none(), some("bar")],
    ]);
});

Deno.test("equality", () => {
    const equality = eq({
        eq: (l: bigint, r: bigint) => l === r,
        [eqSymbol]: true,
    }, stringEq);
    // symmetric
    for (let x = -100n; x <= 100n; ++x) {
        for (const y of ["foo", "bar", "", "hoge"]) {
            assertEquals(equality.eq(newBreak(x), newBreak(x)), true);
            assertEquals(equality.eq(newContinue(y), newContinue(y)), true);
            assertEquals(equality.eq(newBreak(x), newContinue(y)), false);
            assertEquals(equality.eq(newContinue(y), newBreak(x)), false);
        }
    }

    // transitive
    for (let x = -100n; x <= 100n; ++x) {
        for (const y of ["foo", "bar", "", "hoge"]) {
            for (let z = -200n; z <= 200n; ++z) {
                assertEquals(
                    equality.eq(newBreak(x), newContinue(y)) &&
                        equality.eq(newContinue(y), newBreak(z)),
                    false,
                );
                assertEquals(
                    equality.eq(newContinue(y), newBreak(x)) &&
                        equality.eq(newBreak(x), newBreak(z)),
                    false,
                );
            }
        }
    }
});

Deno.test("partial equality unary", () => {
    const equalityUnary = partialEqUnary(stringEq);
    const equality = equalityUnary.liftEq((l: bigint, r: bigint) => l === r);

    // symmetric
    for (const x of ["foo", "bar", "", "hoge"]) {
        for (let y = -100n; y <= 100n; ++y) {
            assertEquals(equality(newBreak(x), newBreak(x)), true);
            assertEquals(equality(newContinue(y), newContinue(y)), true);
            assertEquals(equality(newBreak(x), newContinue(y)), false);
            assertEquals(equality(newContinue(y), newBreak(x)), false);
        }
    }

    // transitive
    for (const x of ["foo", "bar", "", "hoge"]) {
        for (let y = -100n; y <= 100n; ++y) {
            for (let z = -200n; z <= 200n; ++z) {
                assertEquals(
                    equality(newBreak(x), newContinue(y)) &&
                        equality(newContinue(y), newContinue(z)),
                    false,
                );
                assertEquals(
                    equality(newContinue(y), newBreak(x)) &&
                        equality(newBreak(x), newContinue(z)),
                    false,
                );
            }
        }
    }
});

Deno.test("map", () => {
    const actual = cases.map((
        c,
    ) => [
        mapContinue((x: string) => x.toUpperCase())(c),
        mapBreak((x: string) => x.toUpperCase())(c),
    ]);
    assertEquals(actual, [
        [newContinue("FOO"), newContinue("foo")],
        [newBreak("bar"), newBreak("BAR")],
    ]);
});

Deno.test("apply", () => {
    const mapper = newContinue((x: string) => x + "!") as ControlFlow<
        never[],
        (x: string) => string
    >;
    assertEquals(apply(mapper)(newContinue("foo")), newContinue("foo!"));
    assertEquals(apply(mapper)(newBreak([])), newBreak([]));
    assertEquals(apply(newBreak([]))(newContinue("foo")), newBreak([]));
    assertEquals(apply(newBreak([]))(newBreak([])), newBreak([]));
});

Deno.test("biMap", () => {
    const actual = cases.map(
        biMap((x: string) => x + "!")((x: string) => x + "?"),
    );
    assertEquals(actual, [
        newContinue("foo?"),
        newBreak("bar!"),
    ]);
});

Deno.test("flatten", () => {
    assertEquals(flatten(newBreak("hoge")), newBreak("hoge"));
    assertEquals(flatten(newContinue(newBreak("foo"))), newBreak("foo"));
    assertEquals(flatten(newContinue(newContinue("bar"))), newContinue("bar"));
});

Deno.test("functor laws", () => {
    const f = functor<never[]>();
    const data = newContinue(2);
    // identity
    assertEquals(f.map((x: number) => x)(data), data);

    // composition
    const add = (x: number) => x + 3;
    const mul = (x: number) => x * 2;
    assertEquals(
        f.map((x: number) => mul(add(x)))(data),
        f.map(mul)(f.map(add)(data)),
    );
});

Deno.test("applicative laws", () => {
    const a = applicative<string>();
    const strLen = a.pure((x: string) => x.length);
    const question = a.pure((x: string) => x + "?");

    for (const data of cases) {
        // identity
        assertEquals(apply(a.pure((x: string) => x))(data), data);

        // composition
        assertEquals(
            apply(
                apply(
                    apply(
                        a.pure(
                            (f: (x: string) => number) =>
                            (g: (x: string) => string) =>
                            (i: string) => f(g(i)),
                        ),
                    )(strLen),
                )(question),
            )(data),
            apply(strLen)(apply(question)(data)),
        );
    }

    // homomorphism
    assertEquals(
        apply(a.pure((x: string) => x + "!"))(a.pure("foo")),
        a.pure("foo!"),
    );

    // interchange
    assertEquals(
        apply(strLen)(a.pure("boo")),
        apply(a.pure((f: (x: string) => number) => f("boo")))(strLen),
    );
});

Deno.test("monad laws", () => {
    const m = monad<number>();
    const continuing = (x: string): ControlFlow<number, string> =>
        newContinue(x);
    const breaking = (x: string): ControlFlow<number, string> =>
        newBreak(x.length);
    const cases = [continuing, breaking];

    // left identity
    for (const c of cases) {
        assertEquals(m.flatMap(c)(m.pure("baz")), c("baz"));
    }

    // right identity
    assertEquals(m.flatMap(m.pure)(newContinue("a")), newContinue("a"));
    assertEquals(m.flatMap(m.pure)(newBreak(2)), newBreak(2));

    // associativity
    for (const data of [newContinue("a"), newBreak(2)]) {
        assertEquals(
            m.flatMap(breaking)(m.flatMap(continuing)(data)),
            m.flatMap((x: string) => m.flatMap(breaking)(continuing(x)))(data),
        );
        assertEquals(
            m.flatMap(continuing)(m.flatMap(breaking)(data)),
            m.flatMap((x: string) => m.flatMap(continuing)(breaking(x)))(data),
        );
    }
});

Deno.test("foldR", () => {
    {
        const actual = foldR((next: string) => (acc: string) => next + acc)("")(
            cases[0],
        );
        assertEquals(actual, "foo");
    }
    {
        const actual = foldR((next: string) => (acc: string) => next + acc)("")(
            cases[1],
        );
        assertEquals(actual, "");
    }
});

Deno.test("traversable laws", () => {
    const t = traversable<string>();
    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option<T> => 0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    const data = newContinue("fever");
    assertEquals(
        first(t.traverse(Array.applicative)(dup)(data)),
        t.traverse(applicativeOption)((item: string) => first(dup(item)))(
            data,
        ),
    );

    // identity
    for (const c of cases) {
        assertEquals(t.traverse(applicativeIdentity)((x: string) => x)(c), c);
    }

    // composition
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    assertEquals(
        t.traverse(Compose.applicative(Array.applicative)(applicativeOption))(
            (x: string) => Array.map(firstCh)(dup(x)),
        )(data),
        Array.map(t.traverse(applicativeOption)(firstCh))(
            t.traverse(Array.applicative)(dup)(data),
        ),
    );
});

Deno.test("traversable monad laws", () => {
    const t = traversableMonad<number>();

    const continuing = (x: string): ControlFlow<number, string> =>
        newContinue(x);
    const breaking = (x: string): ControlFlow<number, string> =>
        newBreak(x.length);

    // left identity
    for (const c of [continuing, breaking]) {
        assertEquals(t.flatMap(c)(t.pure("baz")), c("baz"));
    }

    // right identity
    assertEquals(t.flatMap(t.pure)(newContinue("a")), newContinue("a"));
    assertEquals(t.flatMap(t.pure)(newBreak(2)), newBreak(2));

    // associativity
    for (const data of [newContinue("a"), newBreak(2)]) {
        assertEquals(
            t.flatMap(breaking)(t.flatMap(continuing)(data)),
            t.flatMap((x: string) => t.flatMap(breaking)(continuing(x)))(data),
        );
        assertEquals(
            t.flatMap(continuing)(t.flatMap(breaking)(data)),
            t.flatMap((x: string) => t.flatMap(continuing)(breaking(x)))(data),
        );
    }

    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option<T> => 0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    const data = newContinue("fever");
    assertEquals(
        first(t.traverse(Array.applicative)(dup)(data)),
        t.traverse(applicativeOption)((item: string) => first(dup(item)))(
            data,
        ),
    );

    // identity
    for (const c of [newContinue("foo"), newBreak(6)]) {
        assertEquals(t.traverse(applicativeIdentity)((x: string) => x)(c), c);
    }

    // composition
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    assertEquals(
        t.traverse(Compose.applicative(Array.applicative)(applicativeOption))(
            (x: string) => Array.map(firstCh)(dup(x)),
        )(data),
        Array.map(t.traverse(applicativeOption)(firstCh))(
            t.traverse(Array.applicative)(dup)(data),
        ),
    );
});

Deno.test("encode then decode", () => {
    const data: readonly ControlFlow<string, number>[] = [
        newContinue(42),
        newBreak("foo"),
    ];
    for (const datum of data) {
        const code = runCode(enc(encUtf8)(encU32Be)(datum));
        const decoded = unwrap(runDecoder(dec(decUtf8())(decU32Be()))(code));
        assertEquals(datum, decoded);
    }
});

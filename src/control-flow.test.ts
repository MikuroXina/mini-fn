import { assertEquals } from "../deps.ts";
import { Array, Compose } from "../mod.ts";
import {
    apply,
    biMap,
    breakValue,
    continueValue,
    type ControlFlow,
    dec,
    enc,
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
    traversable,
} from "./control-flow.ts";
import { applicative as applicativeIdentity } from "./identity.ts";
import {
    applicative as applicativeOption,
    none,
    type Option,
    some,
} from "./option.ts";
import { unwrap } from "./result.ts";
import { decUtf8 } from "./serial.ts";
import { decU32Be } from "./serial.ts";
import { runDecoder } from "./serial.ts";
import { runCode } from "./serial.ts";
import { encU32Be, encUtf8 } from "./serial.ts";

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
    const a = monad<never[]>();
    const data = newContinue("2");
    // identity
    assertEquals(apply(a.pure((x: string) => x))(data), data);

    // composition
    const strLen = a.pure((x: string) => x.length);
    const question = a.pure((x: string) => x + "?");
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

Deno.test("encode then decode", async () => {
    const data: readonly ControlFlow<string, number>[] = [
        newContinue(42),
        newBreak("foo"),
    ];
    for (const datum of data) {
        const code = await runCode(enc(encUtf8)(encU32Be)(datum));
        const decoded = unwrap(runDecoder(dec(decUtf8())(decU32Be()))(code));
        assertEquals(datum, decoded);
    }
});

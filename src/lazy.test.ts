import { assertEquals, spy } from "../deps.ts";
import { Array, Compose, Identity, Option } from "../mod.ts";
import { id } from "./func.ts";
import {
    applicative,
    dec,
    defer,
    enc,
    force,
    functor,
    known,
    monad,
    partialEq,
    traversable,
} from "./lazy.ts";
import { unwrap } from "./result.ts";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.ts";
import { strict } from "./type-class/partial-eq.ts";

Deno.test("defer and force", () => {
    const fn = spy(() => 21 * 2);
    const lazy = defer(fn);

    assertEquals(force(lazy), 42);
    assertEquals(force(lazy), 42);

    assertEquals(fn.calls.length, 1);
});

const numLazyEq = partialEq(strict<number>());

Deno.test("functor laws", () => {
    const f = functor;
    // identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        assertEquals(numLazyEq.eq(f.map(id)(x), id(x)), true);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (const x of [defer(() => 21 * 2), known(63)]) {
        f.map((x: number) => add3(mul2(x)))(x), f.map(add3)(f.map(mul2)(x));
    }
});

Deno.test("applicative functor laws", () => {
    const app = applicative;
    // identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        assertEquals(
            numLazyEq.eq(app.apply(app.pure((i: number) => i))(x), x),
            true,
        );
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (const x of [defer(() => add3), known(add3)]) {
        for (const y of [defer(() => mul2), known(mul2)]) {
            for (const z of [defer(() => 21 * 2), known(63)]) {
                assertEquals(
                    numLazyEq.eq(
                        app.apply(
                            app.apply(
                                app.apply(
                                    app.pure(
                                        (f: (x: number) => number) =>
                                        (g: (x: number) => number) =>
                                        (i: number) => f(g(i)),
                                    ),
                                )(x),
                            )(y),
                        )(z),
                        app.apply(x)(app.apply(y)(z)),
                    ),
                    true,
                );
            }
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        assertEquals(
            numLazyEq.eq(
                app.apply(app.pure(add3))(app.pure(x)),
                app.pure(add3(x)),
            ),
            true,
        );
    }

    // interchange
    for (const f of [defer(() => add3), known(add3)]) {
        for (let x = -100; x <= 100; ++x) {
            assertEquals(
                numLazyEq.eq(
                    app.apply(f)(app.pure(x)),
                    app.apply(app.pure((i: (x: number) => number) => i(x)))(f),
                ),
                true,
            );
        }
    }
});

Deno.test("monad laws", () => {
    const add3 = (x: number) => defer(() => x + 3);
    const mul2 = (x: number) => defer(() => x * 2);

    const m = monad;
    // left identity
    for (const f of [add3, mul2]) {
        for (let x = -100; x <= 100; ++x) {
            assertEquals(numLazyEq.eq(m.flatMap(f)(m.pure(x)), f(x)), true);
        }
    }

    // right identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        assertEquals(numLazyEq.eq(m.flatMap(m.pure)(x), x), true);
    }

    // associativity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        assertEquals(
            numLazyEq.eq(
                m.flatMap(add3)(m.flatMap(mul2)(x)),
                m.flatMap((x: number) => m.flatMap(add3)(mul2(x)))(x),
            ),
            true,
        );
    }
});

Deno.test("traversable functor laws", () => {
    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option.Option<T> => 0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    for (const x of [defer(() => "foo"), known("bar")]) {
        assertEquals(
            Option.map(force)(
                first(traversable.traverse(Array.applicative)(dup)(x)),
            ),
            Option.map(force)(
                traversable.traverse(Option.applicative)((item: string) =>
                    first(dup(item))
                )(x),
            ),
        );
    }

    // identity
    for (const x of [defer(() => "foo"), known("bar")]) {
        assertEquals(
            force(
                traversable.traverse(Identity.applicative)(<T>(a: T): T => a)(
                    x,
                ),
            ),
            force(x),
        );
    }

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [defer(() => "foo"), known("bar")]) {
        assertEquals(
            traversable.traverse(app)((item: string) =>
                Array.map(firstCh)(dup(item))
            )(x).map(Option.map(force)),
            Array.map(traversable.traverse(Option.applicative)(firstCh))(
                traversable.traverse(Array.applicative)(dup)(x),
            ).map(Option.map(force)),
        );
    }
});

Deno.test("encode then decode", () => {
    for (const x of [defer(() => 21 * 2), known(42)]) {
        const code = runCode(enc(encU32Be)(x));
        const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
        assertEquals(force(decoded), force(x));
    }
});

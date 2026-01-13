import { expect, test, vi } from "vitest";
import { Array, Compose, Identity, Option } from "../mod.js";
import { id } from "./func.js";
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
} from "./lazy.js";
import { unwrap } from "./result.js";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.js";
import { strict } from "./type-class/partial-eq.js";

test("defer and force", () => {
    const fn = vi.fn(() => 21 * 2);
    const lazy = defer(fn);

    expect(force(lazy)).toStrictEqual(42);
    expect(force(lazy)).toStrictEqual(42);

    expect(fn.mock.calls.length).toStrictEqual(1);
});

const numLazyEq = partialEq(strict<number>());

test("functor laws", () => {
    const f = functor;
    // identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        expect(numLazyEq.eq(f.map(id)(x), id(x))).toStrictEqual(true);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (const x of [defer(() => 21 * 2), known(63)]) {
        expect(force(f.map((x: number) => add3(mul2(x)))(x))).toStrictEqual(
            force(f.map(add3)(f.map(mul2)(x))),
        );
    }
});

test("applicative functor laws", () => {
    const app = applicative;
    // identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        expect(
            numLazyEq.eq(app.apply(app.pure((i: number) => i))(x), x),
        ).toStrictEqual(true);
    }

    // composition
    const add3 = (x: number) => x + 3;
    const mul2 = (x: number) => x * 2;
    for (const x of [defer(() => add3), known(add3)]) {
        for (const y of [defer(() => mul2), known(mul2)]) {
            for (const z of [defer(() => 21 * 2), known(63)]) {
                expect(
                    numLazyEq.eq(
                        app.apply(
                            app.apply(
                                app.apply(
                                    app.pure(
                                        (f: (x: number) => number) =>
                                            (g: (x: number) => number) =>
                                            (i: number) =>
                                                f(g(i)),
                                    ),
                                )(x),
                            )(y),
                        )(z),
                        app.apply(x)(app.apply(y)(z)),
                    ),
                ).toStrictEqual(true);
            }
        }
    }

    // homomorphism
    for (let x = -100; x <= 100; ++x) {
        expect(
            numLazyEq.eq(
                app.apply(app.pure(add3))(app.pure(x)),
                app.pure(add3(x)),
            ),
        ).toStrictEqual(true);
    }

    // interchange
    for (const f of [defer(() => add3), known(add3)]) {
        for (let x = -100; x <= 100; ++x) {
            expect(
                numLazyEq.eq(
                    app.apply(f)(app.pure(x)),
                    app.apply(app.pure((i: (x: number) => number) => i(x)))(f),
                ),
            ).toStrictEqual(true);
        }
    }
});

test("monad laws", () => {
    const add3 = (x: number) => defer(() => x + 3);
    const mul2 = (x: number) => defer(() => x * 2);

    const m = monad;
    // left identity
    for (const f of [add3, mul2]) {
        for (let x = -100; x <= 100; ++x) {
            expect(numLazyEq.eq(m.flatMap(f)(m.pure(x)), f(x))).toStrictEqual(
                true,
            );
        }
    }

    // right identity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        expect(numLazyEq.eq(m.flatMap(m.pure)(x), x)).toStrictEqual(true);
    }

    // associativity
    for (const x of [defer(() => 21 * 2), known(63)]) {
        expect(
            numLazyEq.eq(
                m.flatMap(add3)(m.flatMap(mul2)(x)),
                m.flatMap((x: number) => m.flatMap(add3)(mul2(x)))(x),
            ),
        ).toStrictEqual(true);
    }
});

test("traversable functor laws", () => {
    // naturality
    const first = <T>(x: readonly T[]): Option.Option<T> =>
        0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [`    ${x}}0`, `${x}1`];
    for (const x of [defer(() => "foo"), known("bar")]) {
        expect(
            Option.map(force)(
                first(traversable.traverse(Array.applicative)(dup)(x)),
            ),
        ).toStrictEqual(
            Option.map(force)(
                traversable.traverse(Option.applicative)((item: string) =>
                    first(dup(item)),
                )(x),
            ),
        );
    }

    // identity
    for (const x of [defer(() => "foo"), known("bar")]) {
        expect(
            force(
                traversable.traverse(Identity.applicative)(<T>(a: T): T => a)(
                    x,
                ),
            ),
        ).toStrictEqual(force(x));
    }

    // composition
    const app = Compose.applicative(Array.applicative)(Option.applicative);
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    for (const x of [defer(() => "foo"), known("bar")]) {
        expect(
            traversable
                .traverse(app)((item: string) => Array.map(firstCh)(dup(item)))(
                    x,
                )
                .map(Option.map(force)),
        ).toStrictEqual(
            Array.map(traversable.traverse(Option.applicative)(firstCh))(
                traversable.traverse(Array.applicative)(dup)(x),
            ).map(Option.map(force)),
        );
    }
});

test("encode then decode", () => {
    for (const x of [defer(() => 21 * 2), known(42)]) {
        const code = runCode(enc(encU32Be)(x));
        const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
        expect(force(decoded)).toStrictEqual(force(x));
    }
});

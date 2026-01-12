import { expect, test } from "vitest";
import { Array, Compose, Func, Identity, Option, Zipper } from "../mod.js";
import {
    applicative,
    type Coyoneda,
    comonad,
    coyoneda,
    distributive,
    foldRT,
    functor,
    hoist,
    lower,
    monad,
    partialEq,
    partialEqUnary,
    traversable,
    unCoyoneda,
} from "./coyoneda.js";
import type { Apply2Only } from "./hkt.js";
import { strict } from "./type-class/partial-eq.js";

test("hoist", () => {
    const getFirst = <A>(arr: readonly A[]): Option.Option<A> =>
        0 in arr ? Option.some(arr[0]) : Option.none();
    const arrCoy = coyoneda((x: number) => x.toString())<Array.ArrayHkt>([
        2, 7, 1, 8, 2, 8,
    ]);
    const optCoy = hoist<Array.ArrayHkt, Option.OptionHkt>(getFirst)(arrCoy);
    const actual = unCoyoneda<Option.OptionHkt, string, Option.Option<string>>(
        (map) => (image) => Option.map(map)(image),
    )(optCoy);
    expect(actual).toStrictEqual(Option.some("2"));
});

const getValue = unCoyoneda<Array.ArrayHkt, string, readonly string[]>(
    (map) => (image) => image.map(map),
);

test("functor laws", () => {
    const f = functor<Array.ArrayHkt>();
    const arrCoy = coyoneda((x: number) => x.toString())<Array.ArrayHkt>([
        1, 4, 2, 3, 5, 2, 3,
    ]);

    // identity
    const mapped = f.map((x: string) => x)(arrCoy);
    expect(getValue(mapped)).toStrictEqual(getValue(arrCoy));

    // composition
    const dup = (x: string) => x + x;
    const first = (x: string) => x.charAt(0);
    expect(getValue(f.map((x: string) => dup(first(x)))(arrCoy))).toStrictEqual(
        getValue(f.map(dup)(f.map(first)(arrCoy))),
    );
});

test("applicative functor laws", () => {
    const a = applicative(Array.applicative);
    const arrCoy = coyoneda((x: number) => x.toString())<Array.ArrayHkt>([
        1, 4, 2, 3, 5, 2, 3,
    ]);

    // identity
    expect(getValue(a.apply(a.pure((x: string) => x))(arrCoy))).toStrictEqual(
        getValue(arrCoy),
    );

    // composition
    const exclamation = a.pure((x: string) => x + "!");
    const question = a.pure((x: string) => x + "?");
    expect(
        getValue(
            a.apply(
                a.apply(
                    a.apply(
                        a.pure(
                            (f: (x: string) => string) =>
                                (g: (x: string) => string) =>
                                (i: string) =>
                                    f(g(i)),
                        ),
                    )(exclamation),
                )(question),
            )(arrCoy),
        ),
    ).toStrictEqual(getValue(a.apply(exclamation)(a.apply(question)(arrCoy))));

    // homomorphism
    const period = (x: string) => x + ".";
    expect(getValue(a.apply(a.pure(period))(a.pure("Alice")))).toStrictEqual(
        getValue(a.pure(period("Alice"))),
    );

    // interchange
    expect(getValue(a.apply(exclamation)(a.pure("Bob")))).toStrictEqual(
        getValue(
            a.apply(a.pure((op: (x: string) => string) => op("Bob")))(
                exclamation,
            ),
        ),
    );
});

test("monad laws", () => {
    const m = monad(Array.monad);

    // left identity
    const upperCase = (x: string) =>
        coyoneda((x: string) => x.toUpperCase())<Array.ArrayHkt>([x]);
    expect(getValue(m.flatMap(upperCase)(m.pure("foo")))).toStrictEqual(
        getValue(upperCase("foo")),
    );

    // right identity
    const data = upperCase("bar");
    expect(getValue(m.flatMap(m.pure)(data))).toStrictEqual(getValue(data));

    // associativity
    const shout = (x: string) =>
        coyoneda((x: string) => x + " eh!")<Array.ArrayHkt>([x]);
    expect(
        getValue(m.flatMap(shout)(m.flatMap(upperCase)(data))),
    ).toStrictEqual(
        getValue(
            m.flatMap((x: string) => m.flatMap(shout)(upperCase(x)))(data),
        ),
    );
});

test("comonad laws", () => {
    const w = comonad(Zipper.comonad);
    const lowerZipper = lower(Zipper.functor);
    const equality = Zipper.partialEquality(strict<number>());
    const zipperCoy = coyoneda((x: number) => x + 1)<Zipper.ZipperHkt>(
        Zipper.singleton(42),
    );

    // duplicate then extract
    expect(
        equality(
            lowerZipper(w.extract(w.duplicate(zipperCoy))),
            lowerZipper(zipperCoy),
        ),
    ).toStrictEqual(true);

    // extract as identity of map
    expect(
        equality(
            lowerZipper(w.map(w.extract)(w.duplicate(zipperCoy))),
            lowerZipper(zipperCoy),
        ),
    ).toStrictEqual(true);

    // duplicate as identity of map
    const coyEquality = Zipper.partialEqUnary.liftEq(
        partialEqUnary(Zipper.partialEqUnary).liftEq(
            partialEqUnary(Zipper.partialEqUnary).liftEq(strict<number>().eq),
        ),
    );
    expect(
        coyEquality(
            lowerZipper(w.duplicate(w.duplicate(zipperCoy))),
            lowerZipper(w.map(w.duplicate)(w.duplicate(zipperCoy))),
        ),
    ).toStrictEqual(true);
});

test("foldRT", () => {
    const arrCoy = coyoneda((x: number) => x + 1)<Array.ArrayHkt>([42, 4, 3]);
    const actual = foldRT(Array.foldable)(
        (next: number) => (acc: readonly number[]) => [next, ...acc],
    )([])(arrCoy);
    expect(actual).toStrictEqual([43, 5, 4]);
});

test("traversable functor laws", () => {
    const tra = traversable(Array.traversable);
    const arrCoy = coyoneda((x: string) => x + "!")<Array.ArrayHkt>(["42"]);

    // naturality
    const first = <T>(x: readonly T[]): Option.Option<T> =>
        0 in x ? Option.some(x[0]) : Option.none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    const equality = partialEq({
        lifter: Array.partialEqUnary,
        equality: (l: string, r: string) => l === r,
    });
    const equalityOnOption = Option.partialEq(equality);
    expect(
        equalityOnOption.eq(
            first(tra.traverse(Array.applicative)(dup)(arrCoy)),
            tra.traverse(Option.applicative)((item: string) =>
                first(dup(item)),
            )(arrCoy),
        ),
    ).toStrictEqual(true);

    // identity
    expect(
        equality.eq(
            tra.traverse(Identity.applicative)((a: string) => a)(arrCoy),
            arrCoy,
        ),
    ).toStrictEqual(true);

    // composition
    const firstCh = (x: string): Option.Option<string> =>
        x.length > 0 ? Option.some(x.charAt(0)) : Option.none();
    expect(
        Array.partialEquality(equalityOnOption)(
            tra.traverse(
                Compose.applicative(Array.applicative)(Option.applicative),
            )((x: string) => Array.map(firstCh)(dup(x)))(arrCoy),
            Array.map(tra.traverse(Option.applicative)(firstCh))(
                tra.traverse(Array.applicative)(dup)(arrCoy),
            ),
        ),
    ).toStrictEqual(true);
});

test("distributive functor laws", () => {
    const g = distributive(Func.distributive<number>());
    const fnEquality = (
        l: (x: number) => readonly number[],
        r: (x: number) => readonly number[],
    ) => {
        for (let i = -100; i < 100; ++i) {
            if (!Array.partialEq(strict<number>()).eq([...l(i)], [...r(i)])) {
                return false;
            }
        }
        return true;
    };
    const lowerFn = lower(Func.functor<number>());
    const data = [
        coyoneda((x: number) => x + 1)<Apply2Only<Func.FnHkt, number>>(
            (x) => x * 2,
        ),
        coyoneda((x: number) => x + 2)<Apply2Only<Func.FnHkt, number>>(
            (x) => x * 3,
        ),
    ];

    // identity
    expect(
        fnEquality(
            lowerFn(g.distribute(Array.functor)(data)),
            lowerFn(
                g.distribute(Array.functor)(
                    Array.map(
                        (x: Coyoneda<Apply2Only<Func.FnHkt, number>, number>) =>
                            x,
                    )(data),
                ),
            ),
        ),
    ).toStrictEqual(true);

    // reversibility
    const funCoy: Coyoneda<
        Apply2Only<Func.FnHkt, number>,
        Func.Fn<number, number>
    > = coyoneda((x: number) => (y: number) => x + y)((x: number) => x - 1);
    const mapped: Func.Fn<
        number,
        Coyoneda<Apply2Only<Func.FnHkt, number>, number>
    > = Func.distributive<number>().distribute(
        functor<Apply2Only<Func.FnHkt, number>>(),
    )(funCoy);
    const reversed = g.distribute(Func.functor<number>())(mapped);

    for (let i = -100; i < 100; ++i) {
        for (let j = -100; j < 100; ++j) {
            expect(lowerFn(reversed)(i)(j)).toStrictEqual(
                lowerFn(funCoy)(i)(j),
            );
        }
    }
});

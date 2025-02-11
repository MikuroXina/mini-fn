import { assertEquals, assertThrows } from "../deps.ts";
import { iota, range, takeWhile, traversable, zip } from "./list.ts";
import {
    applicative,
    doMut,
    dropMutRef,
    functor,
    mapMutRef,
    modifyMutRef,
    monad,
    type Mut,
    type MutCat,
    type MutRef,
    newMutRef,
    readMutRef,
    writeMutRef,
} from "./mut.ts";
import { doT } from "./cat.ts";
import { forM, forMVoid } from "./type-class/traversable.ts";

Deno.test("hello world", () => {
    const text = doMut(<S>(cat: MutCat<S>) =>
        cat
            .addM("ref", newMutRef("hello"))
            .addMWith("text", ({ ref }) => readMutRef(ref))
            .runWith(({ ref, text }) => writeMutRef(ref)(`${text} world`))
            .finishM(({ ref }) => readMutRef(ref))
    );
    assertEquals(text, "hello world");
});

Deno.test("counter", () => {
    const count = doMut(<S>(cat: MutCat<S>) =>
        cat.addM("count", newMutRef(0))
            .foreach(
                range(0, 1000),
                (_, { count }) => modifyMutRef(count)((c: number) => c + 1),
            ).finishM(({ count }) =>
                mapMutRef((count: number) => `${count}`)(count)
            )
    );
    assertEquals(count, "1000");
});

Deno.test("doubling", () => {
    type Mat = [a11: number, a12: number, a21: number, a22: number];
    const ident: Mat = [1, 0, 0, 1];
    const mul =
        ([a11, a12, a21, a22]: Mat) => ([b11, b12, b21, b22]: Mat): Mat => [
            a11 * b11 + a12 * b21,
            a11 * b12 + a12 * b22,
            a21 * b11 + a22 * b21,
            a21 * b12 + a22 * b22,
        ];
    const mulEq = (right: Mat) => <S>(ref: MutRef<S, Mat>): Mut<S, never[]> =>
        modifyMutRef(ref)((left) => mul(left)(right));
    const pow = (x: Mat) => (exp: number) =>
        doMut(<S>(cat: MutCat<S>) =>
            cat.addM("base", newMutRef(x))
                .addM("ans", newMutRef(ident))
                .runWith(({ base, ans }) =>
                    forMVoid(traversable, cat.monad)(
                        takeWhile((i: number) => exp >> i !== 0)(
                            iota,
                        ),
                    )(
                        (i) =>
                            doT(monad<S>())
                                .addM("right", readMutRef(base))
                                .when(
                                    () => ((exp >> i) & 1) === 1,
                                    ({ right }) => mulEq(right)(ans),
                                )
                                .runWith(({ right }) => mulEq(right)(base))
                                .finish(() => []),
                    )
                )
                .finishM(({ ans }) => readMutRef(ans))
        );
    assertEquals(pow([1, 1, 1, 0])(44), [
        1134903170,
        701408733,
        701408733,
        433494437,
    ]);
});

Deno.test("reading dropped ref", () => {
    assertThrows(() => {
        doMut(<S>(cat: MutCat<S>) =>
            cat.addM("ref", newMutRef(42))
                .runWith(({ ref }) => dropMutRef(ref))
                .finishM(({ ref }) => readMutRef(ref))
        );
    });
});

Deno.test("functor laws", () => {
    // identity
    doMut(<S>(cat: MutCat<S>) => {
        const f = functor<S>();
        return cat.addM(
            "samples",
            forM(traversable, cat.monad)(range(-100, 100))(
                (i) => f.map((x: number) => x)(cat.monad.pure(i)),
            ),
        ).finishM(({ samples }) =>
            forMVoid(traversable, cat.monad)(zip(samples)(range(-100, 100)))(
                ([sample, source]) => {
                    assertEquals(sample, source);
                    return cat.monad.pure([]);
                },
            )
        );
    });

    // composition
    const plus3 = (x: number) => x + 3;
    const double = (x: number) => x * 2;
    doMut(<S>(cat: MutCat<S>) => {
        const f = functor<S>();
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (i) =>
                    f.map((x: number) => plus3(double(x)))(cat.monad.pure(i)),
            ),
        )
            .addM(
                "right",
                forM(traversable, cat.monad)(range(-100, 100))(
                    (i) => f.map(plus3)(f.map(double)(cat.monad.pure(i))),
                ),
            )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });
});

Deno.test("applicative functor laws", () => {
    // identity
    doMut(<S>(cat: MutCat<S>) => {
        const a = applicative<S>();
        return cat.addM(
            "samples",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x) => a.apply(a.pure((i: number) => i))(a.pure(x)),
            ),
        ).finishM(({ samples }) =>
            forMVoid(traversable, cat.monad)(zip(samples)(range(-100, 100)))(
                ([sample, x]) => {
                    assertEquals(sample, x);
                    return cat.monad.pure([]);
                },
            )
        );
    });

    // composition
    doMut(<S>(cat: MutCat<S>) => {
        const a = applicative<S>();
        const add3 = a.pure((x: number) => x + 3);
        const sq = a.pure((x: number) => x ** 2);
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x) =>
                    a.apply(
                        a.apply(
                            a.apply(a.pure(
                                (f: (x: number) => number) =>
                                (g: (x: number) => number) =>
                                (i: number) => f(g(i)),
                            ))(add3),
                        )(sq),
                    )(cat.monad.pure(x)),
            ),
        ).addM(
            "right",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x: number) => a.apply(add3)(a.apply(sq)(cat.monad.pure(x))),
            ),
        )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });

    // homomorphism
    const double = (x: number) => x * 2;
    doMut(<S>(cat: MutCat<S>) => {
        const a = applicative<S>();
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x) => a.apply(a.pure(double))(cat.monad.pure(x)),
            ),
        ).addM(
            "right",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x: number) => cat.monad.pure(double(x)),
            ),
        )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });

    // interchange
    doMut(<S>(cat: MutCat<S>) => {
        const a = applicative<S>();
        const sq = a.pure((x: number) => x ** 2);
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x) => a.apply(sq)(cat.monad.pure(x)),
            ),
        ).addM(
            "right",
            forM(traversable, cat.monad)(range(-100, 100))(
                (x: number) =>
                    a.apply(a.pure((f: (x: number) => number) => f(x)))(sq),
            ),
        )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });
});

Deno.test("monad laws", () => {
    // left identity
    doMut(<S>(cat: MutCat<S>) => {
        const toStr = (x: number) => cat.monad.pure(`${x}`);
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (i) => cat.monad.flatMap(toStr)(cat.monad.pure(i)),
            ),
        )
            .addM(
                "right",
                forM(traversable, cat.monad)(range(-100, 100))(toStr),
            )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });

    // right identity
    doMut(<S>(cat: MutCat<S>) =>
        cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (i) => cat.monad.flatMap(cat.monad.pure)(cat.monad.pure(i)),
            ),
        )
            .addM(
                "right",
                forM(traversable, cat.monad)(range(-100, 100))(cat.monad.pure),
            )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            )
    );

    // associativity
    doMut(<S>(cat: MutCat<S>) => {
        const toStr = (x: number) => cat.monad.pure(`${x}`);
        const dup = (x: string) => cat.monad.pure(x + x);
        return cat.addM(
            "left",
            forM(traversable, cat.monad)(range(-100, 100))(
                (i) =>
                    cat.monad.flatMap(dup)(
                        cat.monad.flatMap(toStr)(cat.monad.pure(i)),
                    ),
            ),
        )
            .addM(
                "right",
                forM(traversable, cat.monad)(range(-100, 100))(
                    (i) =>
                        cat.monad.flatMap((x: number) =>
                            cat.monad.flatMap(dup)(toStr(x))
                        )(cat.monad.pure(i)),
                ),
            )
            .finishM(({ left, right }) =>
                forMVoid(traversable, cat.monad)(zip(left)(right))(
                    ([l, r]) => {
                        assertEquals(l, r);
                        return cat.monad.pure([]);
                    },
                )
            );
    });
});

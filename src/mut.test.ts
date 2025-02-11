import { assertEquals, assertThrows } from "../deps.ts";
import { iota, range, takeWhile, traversable } from "./list.ts";
import {
    doMut,
    dropMutRef,
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
import { forMVoid } from "./type-class/traversable.ts";

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
            ).finishM(({ count }) => readMutRef(count))
    );
    assertEquals(count, 1000);
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

import { assertEquals } from "../deps.ts";
import { doT } from "./cat.ts";
import {
    modifyMutRef,
    monad,
    type Mut,
    newMutRef,
    readMutRef,
    runMut,
    writeMutRef,
} from "./mut.ts";

Deno.test("hello world", () => {
    const text = runMut(<S>() =>
        doT(monad<S>())
            .addM("ref", newMutRef("hello"))
            .addMWith("text", ({ ref }) => readMutRef(ref))
            .runWith(({ ref, text }) => writeMutRef(ref)(`${text} world`))
            .finishM(({ ref }) => readMutRef(ref))
    );
    assertEquals(text, "hello world");
});

Deno.test("counter", () => {
    const count = runMut(<S>() => {
        const m = monad<S>();
        return doT(m)
            .addM("count", newMutRef(0))
            .runWith(
                ({ count }) => {
                    const loop = (i: number): Mut<S, []> =>
                        i <= 0 ? m.pure([]) : m.flatMap(() => loop(i - 1))(
                            modifyMutRef(count)((c: number) => c + 1),
                        );
                    return loop(1000);
                },
            ).finishM(({ count }) => readMutRef(count));
    });
    assertEquals(count, 1000);
});

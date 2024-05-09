import { assertEquals } from "../deps.ts";
import { doT } from "./cat.ts";
import {
    mapMut,
    modifyMutRef,
    monad,
    newMutRef,
    readMutRef,
    runMut,
} from "./mut.ts";

Deno.test("counter", () => {
    const count = runMut(<S>() =>
        doT(monad<S>())
            .addM("count", newMutRef(0))
            .whileM(
                ({ count }) =>
                    mapMut((c: number) => c < 1000)(readMutRef(count)),
                ({ count }) => modifyMutRef(count)((c) => c + 1),
            ).finishM(({ count }) => readMutRef(count))
    );
    assertEquals(count, 1000);
});

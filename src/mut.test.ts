import { assertEquals } from "../deps.ts";
import { range } from "./list.ts";
import {
    doMut,
    modifyMutRef,
    newMutRef,
    readMutRef,
    writeMutRef,
} from "./mut.ts";

Deno.test("hello world", () => {
    const text = doMut((cat) =>
        cat
            .addM("ref", newMutRef("hello"))
            .addMWith("text", ({ ref }) => readMutRef(ref))
            .runWith(({ ref, text }) => writeMutRef(ref)(`${text} world`))
            .finishM(({ ref }) => readMutRef(ref))
    );
    assertEquals(text, "hello world");
});

Deno.test("counter", () => {
    const count = doMut((cat) =>
        cat.addM("count", newMutRef(0))
            .foreach(
                range(0, 1000),
                (_, { count }) => modifyMutRef(count)((c: number) => c + 1),
            ).finishM(({ count }) => readMutRef(count))
    );
    assertEquals(count, 1000);
});

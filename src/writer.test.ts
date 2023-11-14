import { assertEquals } from "std/assert/mod.ts";
import { cat, doVoidT } from "./cat.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import {
    censor,
    evaluateWriter,
    executeWriter,
    flatMap,
    listen,
    makeMonad,
    map,
    pure,
    tell,
    type Writer,
} from "./writer.ts";

const monoidArray = <T>(): Monoid<T[]> => ({
    identity: [],
    combine: (l, r) => [...l, ...r],
    [semiGroupSymbol]: true,
});

Deno.test("tell with tower of hanoi", () => {
    const monoid = monoidArray<[string, string]>();

    const hanoi = (
        height: number,
        from: string,
        to: string,
        another: string,
    ): Writer<[string, string][], void> => {
        if (height < 1) {
            return pure(monoid)(undefined);
        }
        if (height === 1) {
            return tell([[from, to]]);
        }
        return cat(hanoi(height - 1, from, another, to))
            .feed(flatMap(monoid)(() => tell([[from, to]])))
            .feed(flatMap(monoid)(() => hanoi(height - 1, another, to, from)))
            .value;
    };

    const res = hanoi(3, "A", "B", "C");
    assertEquals(executeWriter(res), [
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
        ["A", "B"],
        ["C", "A"],
        ["C", "B"],
        ["A", "B"],
    ]);
});

Deno.test("listen with collatz sequence", () => {
    const monoid = monoidArray<number>();

    const collatz = (n: number) => {
        if (n % 2 == 0) {
            return n / 2;
        }
        return 3 * n + 1;
    };
    const collatzW = (n: number): Writer<number[], number> =>
        cat(tell([n])).feed(map(() => collatz(n))).value;
    const lengthOfSeq = (
        writer: Writer<number[], number>,
    ): Writer<number[], number> =>
        map(([_last, numbers]: [number, number[]]) => numbers.length)(
            listen(writer),
        );
    const collatzSeq = (n: number): Writer<number[], number> => {
        const seq = (num: number): Writer<number[], number> =>
            cat(collatzW(num)).feed(
                flatMap(monoid)((value: number) => {
                    if (value === 1) {
                        return pure(monoid)(1);
                    }
                    return seq(value);
                }),
            ).value;
        return lengthOfSeq(seq(n));
    };

    const res = collatzSeq(13);
    assertEquals(executeWriter(res), [13, 40, 20, 10, 5, 16, 8, 4, 2]);
    assertEquals(evaluateWriter(res), 9);
});

Deno.test("censor with log decoration", () => {
    const m = makeMonad(monoidArray<string>());

    const hello = doVoidT(m)
        .run(tell(["Hello!"]))
        .run(tell(["What do you do?"])).ctx;
    const log = censor((messages: string[]) =>
        messages.map((message) => `[LOG] ${message}`)
    )(
        hello,
    );
    assertEquals(executeWriter(log), [
        "[LOG] Hello!",
        "[LOG] What do you do?",
    ]);
});

import { expect, test } from "vitest";

import { cat } from "./cat.js";
import type { Monoid } from "./type-class/monoid.js";
import {
    Writer,
    censor,
    evaluateWriter,
    executeWriter,
    flatMap,
    listen,
    map,
    pure,
    tell,
} from "./writer.js";

const monoidArray = <T>(): Monoid<T[]> => ({
    identity: [],
    combine: (l, r) => [...l, ...r],
});

test("tell with tower of hanoi", () => {
    const monoid = monoidArray<[string, string]>();

    const hanoi = (
        height: number,
        from: string,
        to: string,
        another: string,
    ): Writer<[string, string][], []> => {
        if (height < 1) {
            return pure(monoid)([]);
        }
        if (height === 1) {
            return tell([[from, to]]);
        }
        return cat(hanoi(height - 1, from, another, to))
            .feed(flatMap(monoid)(() => tell([[from, to]])))
            .feed(flatMap(monoid)(() => hanoi(height - 1, another, to, from))).value;
    };

    const res = hanoi(3, "A", "B", "C");
    expect(executeWriter(res)).toEqual([
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
        ["A", "B"],
        ["C", "A"],
        ["C", "B"],
        ["A", "B"],
    ]);
});

test("listen with collatz sequence", () => {
    const monoid = monoidArray<number>();

    const collatz = (n: number) => {
        if (n % 2 == 0) {
            return n / 2;
        }
        return 3 * n + 1;
    };
    const collatzW = (n: number): Writer<number[], number> =>
        cat(tell([n])).feed(map(() => collatz(n))).value;
    const lengthOfSeq = (writer: Writer<number[], number>): Writer<number[], number> =>
        map(([_last, numbers]: [number, number[]]) => numbers.length)(listen(writer));
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
    expect(executeWriter(res)).toEqual([13, 40, 20, 10, 5, 16, 8, 4, 2]);
    expect(evaluateWriter(res)).toEqual(9);
});

test("censor with log decoration", () => {
    const monoid = monoidArray<string>();

    const hello = (): Writer<string[], []> =>
        cat(tell(["Hello!"])).feed(flatMap(monoid)(() => tell(["What do you do?"]))).value;
    const log = censor((messages: string[]) => messages.map((message) => `[LOG] ${message}`))(
        hello(),
    );
    expect(executeWriter(log)).toEqual(["[LOG] Hello!", "[LOG] What do you do?"]);
});

import { expect, test, vitest } from "vitest";

import { cat } from "./cat.js";
import {
    callCC,
    type Cont,
    evalCont,
    flatMap,
    mapCont,
    pure,
    runCont,
    runContT,
    when,
    withCont,
} from "./cont.js";
import { id } from "./func.js";
import type { IdentityHkt } from "./identity.js";

test("eval", () => {
    const actual = evalCont<number>(pure(42));
    expect(actual).toBe(42);
});

test("map", () => {
    const actual = evalCont(mapCont((x: number) => x + 1)(pure(42)));
    expect(actual).toBe(43);
});

test("with", () => {
    const cont = withCont((fn: (x: number) => boolean) => (a: string) => fn(parseInt(a, 10)))(
        (callback) => callback("foo"),
    );
    const actual = runCont(cont)(Number.isNaN);
    expect(actual).toBe(true);
});

test("simple usage", () => {
    const calcLength = <A, R>(a: A[]): Cont<R, number> => pure(a.length);
    const double = <R>(num: number): Cont<R, number> => pure(num * 2);
    const callback = vitest.fn();
    cat([1, 2, 3]).feed(calcLength).feed(flatMap(double)).feed(runContT).value(callback);
    expect(callback).toHaveBeenCalledWith(6);
});

test("using callCC", () => {
    const validateName =
        (name: string) =>
        (exit: (a: string) => Cont<string, []>): Cont<string, []> =>
            when(name.length === 0)(exit("expected at least 1 character"));
    const whatYourName = (name: string): string => {
        const cont = callCC<string, IdentityHkt, string, []>(
            (exit) =>
                cat(validateName(name)(exit)).feed(flatMap(() => pure(`Welcome, ${name}!`))).value,
        );
        return runCont(cont)(id);
    };
    expect(whatYourName("Alice")).toBe("Welcome, Alice!");
    expect(whatYourName("")).toBe("expected at least 1 character");
});

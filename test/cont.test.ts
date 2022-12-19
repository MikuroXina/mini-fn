import { Cont, callCC, flatMap, pure, runCont, runContT, when } from "../src/cont.js";
import { expect, test, vitest } from "vitest";

import type { IdentityHktKey } from "../src/identity.js";
import { cat } from "../src/cat.js";
import { id } from "../src/func.js";

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
        const cont = callCC<string, IdentityHktKey, string, []>(
            (exit) =>
                cat(validateName(name)(exit)).feed(flatMap(() => pure(`Welcome, ${name}!`))).value,
        );
        return runCont(cont)(id);
    };
    expect(whatYourName("Alice")).toBe("Welcome, Alice!");
    expect(whatYourName("")).toBe("expected at least 1 character");
});

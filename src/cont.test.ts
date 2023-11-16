import { cat } from "./cat.ts";
import { Cont, flatMap, pure, runContT } from "./cont.ts";
import { assertSpyCall, spy } from "../deps.ts";

Deno.test("simple usage", () => {
    const calcLength = <A, R>(a: readonly A[]): Cont<R, number> =>
        pure(a.length);
    const double = <R>(num: number): Cont<R, number> => pure(num * 2);
    const callback = spy(() => {});
    cat([1, 2, 3]).feed(calcLength).feed(flatMap(double)).feed(runContT).value(
        callback,
    );
    assertSpyCall(callback, 0, {
        args: [6],
    });
});

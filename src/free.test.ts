import { expect, test } from "vitest";
import { catT, doT, doVoidT } from "./cat.js";
import {
    eq,
    type Free,
    foldFree,
    monad as freeMonad,
    liftF,
    monad,
    pure,
    runFree,
    wrap,
} from "./free.js";
import type { Apply2Only, Hkt1 } from "./hkt.js";
import { monadRec, runState, type State, type StateHkt } from "./state.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";
import type { Nt } from "./type-class/nt.js";

test("hello language", () => {
    type Hello<T> = {
        type: "Hello";
        next: T;
    };
    type Hey<T> = {
        type: "Hey";
        next: T;
    };
    type YearsOld<T> = {
        type: "YearsOld";
        years: number;
        next: T;
    };
    type Bye = {
        type: "Bye";
    };
    type HelloLang<T> = Hello<T> | Hey<T> | YearsOld<T> | Bye;

    interface HelloLangHkt extends Hkt1 {
        readonly type: HelloLang<this["arg1"]>;
    }

    const map =
        <T1, U1>(fn: (t: T1) => U1) =>
        (code: HelloLang<T1>): HelloLang<U1> => {
            switch (code.type) {
                case "Hello":
                    return { ...code, next: fn(code.next) };
                case "Hey":
                    return { ...code, next: fn(code.next) };
                case "YearsOld":
                    return { ...code, next: fn(code.next) };
                case "Bye":
                    return { ...code };
            }
        };
    const functor: Functor<HelloLangHkt> = { map };

    const runProgram = runFree(functor)<string>(
        (
            op: HelloLang<Free<HelloLangHkt, string>>,
        ): Free<HelloLangHkt, string> => {
            switch (op.type) {
                case "Hello":
                    return pure(`Hello.\n${runProgram(op.next)}`);
                case "Hey":
                    return pure(`Hey.\n${runProgram(op.next)}`);
                case "YearsOld":
                    return pure(
                        `I'm ${op.years} years old.\n${runProgram(op.next)}`,
                    );
                case "Bye":
                    return pure("Bye.\n");
            }
        },
    );

    const hello: Free<HelloLangHkt, never[]> = liftF({
        type: "Hello",
        next: [],
    });
    const hey: Free<HelloLangHkt, never[]> = liftF({ type: "Hey", next: [] });
    const yearsOld = (years: number): Free<HelloLangHkt, never[]> =>
        liftF({ type: "YearsOld", years, next: [] });
    const bye: Free<HelloLangHkt, never[]> = liftF({ type: "Bye" });

    const m = freeMonad<HelloLangHkt>();

    const comparator = eq<HelloLangHkt, unknown>({
        equalityA: fromEquality(() => () => true)(),
        equalityFA: fromEquality(
            <T>(x: Eq<T>) =>
                (l: HelloLang<T>, r: HelloLang<T>) => {
                    if (l.type !== r.type) {
                        return false;
                    }
                    switch (l.type) {
                        case "Hello":
                            return x.eq(l.next, (r as Hello<T>).next);
                        case "Hey":
                            return x.eq(l.next, (r as Hey<T>).next);
                        case "YearsOld":
                            return (
                                l.years === (r as YearsOld<T>).years &&
                                x.eq(l.next, (r as YearsOld<T>).next)
                            );
                        case "Bye":
                            return true;
                    }
                },
        ),
        functor,
    });

    // syntax tree
    {
        const empty: Free<HelloLangHkt, unknown> = pure({});
        const example: Free<HelloLangHkt, string> = wrap({
            type: "Hello",
            next: wrap({ type: "Hello", next: wrap({ type: "Bye" }) }),
        });
        expect(comparator.eq(example, example)).toStrictEqual(true);
        expect(comparator.eq(example, empty)).toStrictEqual(false);
        expect(comparator.eq(empty, example)).toStrictEqual(false);
        expect(comparator.eq(empty, empty)).toStrictEqual(true);
        expect(runProgram(example)).toStrictEqual("Hello.\nHello.\nBye.\n");

        const exampleCode = doVoidT(m).run(hello).run(hello).run(bye).ctx;
        expect(comparator.eq(example, exampleCode)).toStrictEqual(true);
    }

    // program monad
    {
        const subRoutine = doVoidT(m).run(hello).run(yearsOld(25)).ctx;
        const program = catT(m)(pure(""))
            .run(hey)
            .run(subRoutine)
            .run(hey)
            .run(bye).ctx;

        expect(runProgram(program)).toStrictEqual(
            "Hey.\nHello.\nI'm 25 years old.\nHey.\nBye.\n",
        );
    }
});

test("teletype language", () => {
    type TeletypeF<T> =
        | {
              type: "PUT_STR_LN";
              line: string;
              next: T;
          }
        | {
              type: "GET_LINE";
              callback: (line: string) => T;
          };
    interface TeletypeHkt extends Hkt1 {
        readonly type: TeletypeF<this["arg1"]>;
    }
    type Teletype<T> = Free<TeletypeHkt, T>;

    const putStrLn = (line: string): Teletype<never[]> =>
        liftF({ type: "PUT_STR_LN", line, next: [] });
    const getLine: Teletype<string> = liftF({
        type: "GET_LINE",
        callback: (line) => line,
    });

    const teletypeMock: Nt<TeletypeHkt, Apply2Only<StateHkt, string>> = {
        nt:
            <T>(f: TeletypeF<T>): State<string, T> =>
            (state: string): [T, string] =>
                f.type === "PUT_STR_LN"
                    ? [f.next, state + "\n" + f.line]
                    : [f.callback("fake input"), state],
    };

    const run = foldFree(monadRec<string>())(teletypeMock);

    const echo: Teletype<string> = doT(monad<TeletypeHkt>())
        .addM("line", getLine)
        .runWith(({ line }) => putStrLn(line))
        .run(putStrLn("Finished"))
        .finishM(({ line }) => pure<TeletypeHkt, string>(line + ", " + line));

    const actual = runState(run.nt(echo))("");
    expect(actual).toStrictEqual([
        "fake input, fake input",
        "\nfake input\nFinished",
    ]);
});

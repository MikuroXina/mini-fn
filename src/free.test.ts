import { assertEquals } from "std/assert/mod.ts";
import { doVoidT } from "./cat.ts";
import {
    eq,
    type Free,
    isPure,
    liftF,
    monad as freeMonad,
    node,
    pure,
} from "./free.ts";
import type { Hkt1 } from "./hkt.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";

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

Deno.test("hello language", async (t) => {
    const map =
        <T1, U1>(fn: (t: T1) => U1) => (code: HelloLang<T1>): HelloLang<U1> => {
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

    const runProgram = <T>(code: Free<HelloLangHkt, T>): string => {
        if (isPure(code)) {
            return `return ${code[1]}`;
        }
        switch (code[1].type) {
            case "Hello":
                return `Hello.\n${runProgram(code[1].next)}`;
            case "Hey":
                return `Hey.\n${runProgram(code[1].next)}`;
            case "YearsOld":
                return `I'm ${code[1].years} years old.\n${
                    runProgram(code[1].next)
                }`;
            case "Bye":
                return "Bye.\n";
        }
    };

    const hello: Free<HelloLangHkt, void> = liftF(functor)({
        type: "Hello",
        next: undefined,
    });
    const hey: Free<HelloLangHkt, void> = liftF(functor)({
        type: "Hey",
        next: undefined,
    });
    const yearsOld = (years: number): Free<HelloLangHkt, void> =>
        liftF(functor)({ type: "YearsOld", years, next: undefined });
    const bye: Free<HelloLangHkt, void> = liftF(functor)({ type: "Bye" });

    const m = freeMonad(functor);

    const comparator = eq<HelloLangHkt, unknown>({
        equalityA: fromEquality(() => () => true)(),
        equalityFA: fromEquality(
            <T>(x: Eq<T>) => (l: HelloLang<T>, r: HelloLang<T>) => {
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
    });

    await t.step("syntax tree", () => {
        const empty: Free<HelloLangHkt, unknown> = pure({} as unknown);
        const example: Free<HelloLangHkt, unknown> = node<
            HelloLangHkt,
            HelloLang<unknown>
        >({
            type: "Hello",
            next: node<HelloLangHkt, HelloLang<unknown>>({
                type: "Hello",
                next: node<HelloLangHkt, HelloLang<unknown>>({
                    type: "Bye",
                }),
            }),
        });
        assertEquals(comparator.eq(example, example), true);
        assertEquals(comparator.eq(example, empty), false);
        assertEquals(comparator.eq(empty, example), false);
        assertEquals(comparator.eq(empty, empty), true);
        assertEquals(runProgram(example), "Hello.\nHello.\nBye.\n");

        const exampleCode = doVoidT(m).run(hello).run(hello).run(bye).ctx;
        assertEquals(comparator.eq(example, exampleCode), true);
    });

    await t.step("program monad", () => {
        const subRoutine = doVoidT(m).run(hello).run(yearsOld(25)).ctx;
        const program =
            doVoidT(m).run(hey).run(subRoutine).run(hey).run(bye).ctx;

        assertEquals(
            runProgram(program),
            "Hey.\nHello.\nI'm 25 years old.\nHey.\nBye.\n",
        );
    });
});

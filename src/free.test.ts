import { describe, expect, test } from "vitest";

import { cat } from "./cat.js";
import { type Free, eq, flatMapT, isPure, iter, liftF, node, pure, retract } from "./free.js";
import type { Hkt1 } from "./hkt.js";
import { type OptionHkt, isNone, monad, none, some, unwrap } from "./option.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";

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

describe("hello language", () => {
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
                return `I'm ${code[1].years} years old.\n${runProgram(code[1].next)}`;
            case "Bye":
                return "Bye.\n";
        }
    };

    const hello: Free<HelloLangHkt, []> = liftF(functor)({ type: "Hello", next: [] });
    const hey: Free<HelloLangHkt, []> = liftF(functor)({ type: "Hey", next: [] });
    const yearsOld = (years: number): Free<HelloLangHkt, []> =>
        liftF(functor)({ type: "YearsOld", years, next: [] });
    const bye: Free<HelloLangHkt, []> = liftF(functor)({ type: "Bye" });

    const flatMap = flatMapT(functor);

    const comparator = eq<HelloLangHkt, unknown>({
        equalityA: fromEquality(() => () => true)(),
        equalityFA: fromEquality(<T>(x: Eq<T>) => (l: HelloLang<T>, r: HelloLang<T>) => {
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
        }),
    });

    test("syntax tree", () => {
        const empty: Free<HelloLangHkt, unknown> = pure({} as unknown);
        const example: Free<HelloLangHkt, unknown> = node<HelloLangHkt, HelloLang<unknown>>({
            type: "Hello",
            next: node<HelloLangHkt, HelloLang<unknown>>({
                type: "Hello",
                next: node<HelloLangHkt, HelloLang<unknown>>({
                    type: "Bye",
                }),
            }),
        });
        expect(comparator.eq(example, example)).toBe(true);
        expect(comparator.eq(example, empty)).toBe(false);
        expect(comparator.eq(empty, example)).toBe(false);
        expect(comparator.eq(empty, empty)).toBe(true);
        expect(runProgram(example)).toEqual("Hello.\nHello.\nBye.\n");

        const exampleCode: Free<HelloLangHkt, []> = cat(hello)
            .feed(flatMap(() => hello))
            .feed(flatMap(() => bye)).value;
        expect(comparator.eq(example, exampleCode)).toBe(true);
    });

    test("program monad", () => {
        const subRoutine = cat(hello).feed(flatMap(() => yearsOld(25))).value;
        const program: Free<HelloLangHkt, []> = cat(hey)
            .feed(flatMap(() => subRoutine))
            .feed(flatMap(() => hey))
            .feed(flatMap(() => bye)).value;

        expect(runProgram(program)).toEqual("Hey.\nHello.\nI'm 25 years old.\nHey.\nBye.\n");
    });
});

test("retract", () => {
    const retractOption = retract(monad);
    const flatMap = flatMapT<OptionHkt>(monad);
    const lift = liftF<OptionHkt>(monad);
    const retracted = retractOption<string>(
        cat(lift(some("hoge")))
            .feed(flatMap(() => lift(some("fuga"))))
            .feed(flatMap(() => lift<string>(none())))
            .feed(flatMap(() => lift(some("foo")))).value,
    );
    expect(isNone(retracted)).toBe(true);
});

test("iter", () => {
    const iterOption = iter<OptionHkt>(monad)(unwrap);
    const flatMap = flatMapT<OptionHkt>(monad);
    const lift = liftF<OptionHkt>(monad);
    const iterated = iterOption<string>(
        cat(lift(some("hoge")))
            .feed(flatMap(() => lift(some("fuga"))))
            .feed(flatMap(() => lift(some("foo")))).value,
    );
    expect(iterated).toBe("foo");
});

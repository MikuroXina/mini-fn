import { Free, flatMapT, isPure, liftF, node } from "../src/free.js";
import { expect, test } from "vitest";

import type { Functor1 } from "../src/type-class/functor.js";
import { cat } from "../src/cat.js";

declare const helloNominal: unique symbol;
type HelloLangHktKey = typeof helloNominal;
type HelloLang<T> =
    | { type: "Hello"; next: T }
    | { type: "Hey"; next: T }
    | { type: "YearsOld"; years: number; next: T }
    | { type: "Bye" };

declare module "../src/hkt.js" {
    interface HktDictA1<A1> {
        [helloNominal]: HelloLang<A1>;
    }
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
const functor: Functor1<HelloLangHktKey> = { map };

const runProgram = <T>(code: Free<HelloLangHktKey, T>): string => {
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

const hello: Free<HelloLangHktKey, []> = liftF(functor)({ type: "Hello", next: [] });
const hey: Free<HelloLangHktKey, []> = liftF(functor)({ type: "Hey", next: [] });
const yearsOld = (years: number): Free<HelloLangHktKey, []> =>
    liftF(functor)({ type: "YearsOld", years, next: [] });
const bye: Free<HelloLangHktKey, []> = liftF(functor)({ type: "Bye" });

test("syntax tree", () => {
    const example = node<HelloLangHktKey, HelloLang<unknown>>({
        type: "Hello",
        next: node<HelloLangHktKey, HelloLang<unknown>>({
            type: "Hello",
            next: node<HelloLangHktKey, HelloLang<unknown>>({
                type: "Bye",
            }),
        }),
    });

    expect(runProgram(example)).toEqual("Hello.\nHello.\nBye.\n");
});

test("program monad", () => {
    const flatMap = flatMapT(functor);
    const subRoutine = cat(hello).feed(flatMap(() => yearsOld(25))).value;
    const program: Free<HelloLangHktKey, []> = cat(hey)
        .feed(flatMap(() => subRoutine))
        .feed(flatMap(() => hey))
        .feed(flatMap(() => bye)).value;

    expect(runProgram(program)).toEqual("Hey.\nHello.\nI'm 25 years old.\nHey.\nBye.\n");
});

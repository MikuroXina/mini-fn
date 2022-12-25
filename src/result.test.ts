import * as Option from "../src/option.js";
import * as Result from "../src/result.js";

import { describe, expect, test } from "vitest";

describe("Result", () => {
    test("isOk", () => {
        expect(Result.isOk(Result.ok(-3))).toBe(true);
        expect(Result.isOk(Result.err("Some error message"))).toBe(false);
    });
    test("isErr", () => {
        expect(Result.isErr(Result.ok(-3))).toBe(false);
        expect(Result.isErr(Result.err("Some error message"))).toBe(true);
    });
    test("flatten", () => {
        expect(Result.flatten(Result.ok(Result.ok("hello")))).toStrictEqual(Result.ok("hello"));
        expect(Result.flatten(Result.err(Result.ok("hello")))).toStrictEqual(
            Result.err(Result.ok("hello")),
        );
        expect(Result.flatten(Result.ok(Result.err(6)))).toStrictEqual(Result.err(6));
        expect(Result.flatten(Result.err(Result.err(6)))).toStrictEqual(Result.err(Result.err(6)));
    });
    test("mergeOkErr", () => {
        expect(Result.mergeOkErr(Result.ok(3))).toBe(3);
        expect(Result.mergeOkErr(Result.err(4))).toBe(4);
    });
    test("and", () => {
        const success = Result.ok<string, number>(2);
        const failure = Result.err("not a 2");
        const lateError = Result.err("late error");
        const earlyError = Result.err("early error");
        const anotherSuccess = Result.ok("different result");

        expect(Result.and(lateError)(success)).toStrictEqual(lateError);
        expect(Result.and(success)(earlyError)).toStrictEqual(earlyError);
        expect(Result.and(lateError)(failure)).toStrictEqual(failure);
        expect(Result.and(anotherSuccess)(success)).toStrictEqual(anotherSuccess);
    });
    test("andThen", () => {
        const sqrtThenToString = Result.andThen(
            (num: number): Result.Result<string, string> =>
                num < 0
                    ? Result.err("num must not be negative")
                    : Result.ok(Math.sqrt(num).toString()),
        );

        expect(sqrtThenToString(Result.ok(4))).toStrictEqual(Result.ok("2"));
        expect(sqrtThenToString(Result.ok(-1))).toStrictEqual(
            Result.err("num must not be negative"),
        );
        expect(sqrtThenToString(Result.err("not a number"))).toStrictEqual(
            Result.err("not a number"),
        );
    });
    test("or", () => {
        const success = Result.ok<string, number>(2);
        const failure = Result.err<string, number>("not a 2");
        const lateError = Result.err<string, number>("late error");
        const earlyError = Result.err<string, number>("early error");
        const anotherSuccess = Result.ok<string, number>(100);

        expect(Result.or(lateError)(success)).toStrictEqual(success);
        expect(Result.or(success)(earlyError)).toStrictEqual(success);
        expect(Result.or(lateError)(failure)).toStrictEqual(lateError);
        expect(Result.or(anotherSuccess)(success)).toStrictEqual(success);
    });
    test("orElse", () => {
        const sq = Result.orElse((x: number) => Result.ok<number, number>(x * x));
        const err = Result.orElse((x: number) => Result.err<number, number>(x));

        expect(sq(sq(Result.ok(2)))).toStrictEqual(Result.ok(2));
        expect(sq(err(Result.ok(2)))).toStrictEqual(Result.ok(2));
        expect(err(sq(Result.err(3)))).toStrictEqual(Result.ok(9));
        expect(err(err(Result.err(3)))).toStrictEqual(Result.err(3));
    });
    test("optionOk", () => {
        expect(Result.optionOk(Result.ok(2))).toStrictEqual(Option.some(2));
        expect(Result.optionOk(Result.err("nothing left"))).toStrictEqual(Option.none());
    });
    test("optionErr", () => {
        expect(Result.optionErr(Result.ok(2))).toStrictEqual(Option.none());
        expect(Result.optionErr(Result.err("nothing left"))).toStrictEqual(
            Option.some("nothing left"),
        );
    });
    test("toString", () => {
        expect(Result.toString(Result.ok(24))).toStrictEqual("ok(24)");
        expect(Result.toString(Result.err("hoge"))).toStrictEqual("err(hoge)");
    });
    test("toArray", () => {
        expect(Result.toArray(Result.ok(24))).toStrictEqual([24]);
        expect(Result.toArray(Result.err("hoge"))).toStrictEqual([]);
    });
    test("resOptToOptRes", () => {
        expect(Result.resOptToOptRes(Result.ok(Option.some(5)))).toStrictEqual(
            Option.some(Result.ok(5)),
        );
        expect(Result.resOptToOptRes(Result.ok(Option.none()))).toStrictEqual(Option.none());
        expect(Result.resOptToOptRes(Result.err("hoge"))).toStrictEqual(
            Option.some(Result.err("hoge")),
        );
    });
});

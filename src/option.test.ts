import { describe, expect, test } from "vitest";

import * as Option from "./option.js";
import * as Result from "./result.js";

describe("Option", () => {
    test("isSome", () => {
        expect(Option.isSome(Option.some(2))).toBe(true);
        expect(Option.isSome(Option.none())).toBe(false);
    });
    test("isNone", () => {
        expect(Option.isNone(Option.some(2))).toBe(false);
        expect(Option.isNone(Option.none())).toBe(true);
    });
    test("toString", () => {
        expect(Option.toString(Option.some(2))).toBe("some(2)");
        expect(Option.toString(Option.none())).toBe("none");
    });
    test("toArray", () => {
        expect(Option.toArray(Option.some(2))).toStrictEqual([2]);
        expect(Option.toArray(Option.none())).toStrictEqual([]);
    });
    test("flatten", () => {
        expect(Option.flatten(Option.some(Option.some(6)))).toStrictEqual(Option.some(6));
        expect(Option.flatten(Option.some(Option.none()))).toStrictEqual(Option.none());
        expect(Option.flatten(Option.none())).toStrictEqual(Option.none());
    });
    test("and", () => {
        expect(Option.and(Option.none())(Option.none())).toStrictEqual(Option.none());
        expect(Option.and(Option.none())(Option.some(2))).toStrictEqual(Option.none());
        expect(Option.and(Option.some("foo"))(Option.none())).toStrictEqual(Option.none());
        expect(Option.and(Option.some("foo"))(Option.some(2))).toStrictEqual(Option.some("foo"));
    });
    test("andThen", () => {
        const sqrtThenToString = (num: number): Option.Option<string> =>
            0 <= num ? Option.some(Math.sqrt(num).toString()) : Option.none();

        const applied = Option.andThen(sqrtThenToString);
        expect(applied(Option.some(4))).toStrictEqual(Option.some("2"));
        expect(applied(Option.some(-1))).toStrictEqual(Option.none());
        expect(applied(Option.none())).toStrictEqual(Option.none());
    });
    test("or", () => {
        expect(Option.or(Option.none())(Option.none())).toStrictEqual(Option.none());
        expect(Option.or(Option.none())(Option.some(2))).toStrictEqual(Option.some(2));
        expect(Option.or(Option.some(100))(Option.none())).toStrictEqual(Option.some(100));
        expect(Option.or(Option.some(100))(Option.some(2))).toStrictEqual(Option.some(2));
    });
    test("orElse", () => {
        const nobody = Option.orElse((): Option.Option<string> => Option.none());
        const vikings = Option.orElse((): Option.Option<string> => Option.some("vikings"));

        expect(vikings(Option.some("barbarians"))).toStrictEqual(Option.some("barbarians"));
        expect(vikings(Option.none())).toStrictEqual(Option.some("vikings"));
        expect(nobody(Option.none())).toStrictEqual(Option.none());
    });
    test("xor", () => {
        expect(Option.xor(Option.none())(Option.none())).toStrictEqual(Option.none());
        expect(Option.xor(Option.none())(Option.some(2))).toStrictEqual(Option.some(2));
        expect(Option.xor(Option.some(100))(Option.none())).toStrictEqual(Option.some(100));
        expect(Option.xor(Option.some(100))(Option.some(2))).toStrictEqual(Option.none());
    });
    test("filter", () => {
        const isEven = Option.filter((x: number) => x % 2 == 0);

        expect(isEven(Option.none())).toStrictEqual(Option.none());
        expect(isEven(Option.some(3))).toStrictEqual(Option.none());
        expect(isEven(Option.some(4))).toStrictEqual(Option.some(4));
    });
    test("zip", () => {
        expect(Option.zip(Option.some(1))(Option.some("hi"))).toStrictEqual(Option.some([1, "hi"]));
        expect(Option.zip(Option.some(1))(Option.none())).toStrictEqual(Option.none());
    });
    test("unzip", () => {
        expect(Option.unzip(Option.some([1, "hi"]))).toStrictEqual([
            Option.some(1),
            Option.some("hi"),
        ]);
        expect(Option.unzip(Option.none())).toStrictEqual([Option.none(), Option.none()]);
    });
    test("zipWith", () => {
        interface Point {
            x: number;
            y: number;
        }
        const newPoint = Option.zipWith((x: number, y: number): Point => ({ x, y }));
        expect(newPoint(Option.some(17.5))(Option.some(42.7))).toStrictEqual(
            Option.some({ x: 17.5, y: 42.7 }),
        );
        expect(newPoint(Option.none())(Option.none())).toStrictEqual(Option.none());
    });
    test("unwrapOr", () => {
        const unwrapOrBike = Option.unwrapOr("bike");

        expect(unwrapOrBike(Option.some("car"))).toStrictEqual("car");
        expect(unwrapOrBike(Option.none())).toStrictEqual("bike");
    });
    test("unwrapOrElse", () => {
        const unwrapOrCalc = Option.unwrapOrElse(() => 6 ** 4);

        expect(unwrapOrCalc(Option.some(4))).toStrictEqual(4);
        expect(unwrapOrCalc(Option.none())).toStrictEqual(1296);
    });
    test("map", () => {
        const strLen = Option.map((str: string) => str.length);

        expect(strLen(Option.some("Hello, World!"))).toStrictEqual(Option.some(13));
        expect(strLen(Option.none())).toStrictEqual(Option.none());
    });
    test("mapOr", () => {
        const strLenOrAnswer = Option.mapOr(42)((str: string) => str.length);

        expect(strLenOrAnswer(Option.some("Hello, World!"))).toBe(13);
        expect(strLenOrAnswer(Option.none())).toBe(42);
    });
    test("mapOrElse", () => {
        const strLenOrCalc = Option.mapOrElse(() => 6 ** 4)((str: string) => str.length);

        expect(strLenOrCalc(Option.some("Hello, World!"))).toBe(13);
        expect(strLenOrCalc(Option.none())).toBe(1296);
    });
    test("contains", () => {
        const hasTwo = Option.contains(2);

        expect(hasTwo(Option.some(2))).toBe(true);
        expect(hasTwo(Option.some(3))).toBe(false);
        expect(hasTwo(Option.none())).toBe(false);
    });
    test("optResToResOpt", () => {
        expect(Option.optResToResOpt(Option.some(Result.ok(5)))).toStrictEqual(
            Result.ok(Option.some(5)),
        );
        expect(Option.optResToResOpt(Option.none())).toStrictEqual(Result.ok(Option.none()));
        expect(Option.optResToResOpt(Option.some(Result.err(5)))).toStrictEqual(Result.err(5));
    });
    test("okOr", () => {
        const orZero = Option.okOr(0);

        expect(orZero(Option.some("foo"))).toStrictEqual(Result.ok("foo"));
        expect(orZero(Option.none())).toStrictEqual(Result.err(0));
    });
    test("okOrElse", () => {
        const orZero = Option.okOrElse(() => 0);

        expect(orZero(Option.some("foo"))).toStrictEqual(Result.ok("foo"));
        expect(orZero(Option.none())).toStrictEqual(Result.err(0));
    });
});

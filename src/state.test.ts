import { cat } from "./cat.js";
import { State, StateHkt, monad, StateTHkt, put, get } from "./state.js";
import { begin, bindT } from "./type-class/monad.js";
import { expect, test } from "vitest";
import type { Apply2Only } from "./hkt.js";

const xorShiftRng =
    (): State<number, number> =>
    (state: number): [number, number] => {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return [state, state];
    };

test("roll three dices", () => {
    const seed = 1423523;
    const bound = bindT<Apply2Only<StateHkt, number>>(monad())(xorShiftRng);
    const results = cat(begin<StateTHkt>(monad()))
        .feed(bound("result1"))
        .feed(bound("result2"))
        .feed(bound("result3"))
        .value(seed)[0];
    expect(results).toStrictEqual({
        result1: 1463707459,
        result2: -519004248,
        result3: -1370047078,
    });
});

test("twenty times", () => {
    const stateMonad = monad<number>();

    const twentyTimes = (x: number): number =>
        cat(put(x + x))
            .feed(stateMonad.flatMap(get<number>))
            .feed(stateMonad.map((x2: number) => x2 + x2))
            .feed(stateMonad.map((x4: number) => x4 + x4))
            .feed(
                stateMonad.flatMap((x8: number) =>
                    stateMonad.map<number, number>((x2: number) => x8 + x2)(get<number>()),
                ),
            )
            .feed(stateMonad.map((x10: number) => x10 + x10))
            .value(0)[0];

    expect(twentyTimes(10)).toBe(200);
});

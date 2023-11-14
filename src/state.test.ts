import { assertEquals } from "std/assert/mod.ts";
import { cat } from "./cat.ts";
import type { Apply2Only } from "./hkt.ts";
import {
    get,
    monad,
    put,
    type State,
    type StateHkt,
    type StateTHkt,
} from "./state.ts";
import { begin, bindT } from "./type-class/monad.ts";

Deno.test("roll three dices", () => {
    const seed = 1423523;
    const xorShiftRng =
        (): State<number, number> => (state: number): [number, number] => {
            state ^= state << 13;
            state ^= state >> 17;
            state ^= state << 5;
            return [state, state];
        };

    const bound = bindT<Apply2Only<StateHkt, number>>(monad())(xorShiftRng);
    const results = cat(begin<StateTHkt>(monad()))
        .feed(bound("result1"))
        .feed(bound("result2"))
        .feed(bound("result3"))
        .value(seed)[0];
    assertEquals(results, {
        result1: 1463707459,
        result2: -519004248,
        result3: -1370047078,
    });
});

Deno.test("twenty times", () => {
    const stateMonad = monad<number>();

    const twentyTimes = (x: number): number =>
        cat(put(x + x))
            .feed(stateMonad.flatMap(get<number>))
            .feed(stateMonad.map((x2: number) => x2 + x2))
            .feed(stateMonad.map((x4: number) => x4 + x4))
            .feed(
                stateMonad.flatMap((x8: number) =>
                    stateMonad.map<number, number>((x2: number) => x8 + x2)(
                        get<number>(),
                    )
                ),
            )
            .feed(stateMonad.map((x10: number) => x10 + x10))
            .value(0)[0];

    assertEquals(twentyTimes(10), 200);
});

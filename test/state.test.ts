import { Cat, State } from "../src/lib";

import { Monad } from "../src/type-class";

const xorShiftRng =
    (): State.State<number, number> =>
    (state: number): [number, number] => {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return [state, state];
    };

test("roll three dices", () => {
    const seed = 1423523;
    const bound = Monad.bindT(State.monad)(xorShiftRng);
    const results = Cat.cat(Monad.begin<State.StateHktKey, number>(State.monad))
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

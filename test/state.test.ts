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

test("twenty times", () => {
    const twentyTimes = (x: number): number =>
        Cat.cat(State.put(x + x))
            .feed(State.flatMap(State.get<number>))
            .feed(State.map((x2: number) => x2 + x2))
            .feed(State.map((x4: number) => x4 + x4))
            .feed(
                State.flatMap((x8: number) =>
                    State.map<number, number, number>((x2: number) => x8 + x2)(State.get<number>()),
                ),
            )
            .feed(State.map((x10: number) => x10 + x10))
            .value(0)[0];

    expect(twentyTimes(10)).toBe(200);
});

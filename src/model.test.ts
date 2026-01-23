import { expect, test } from "vitest";
import * as Model from "./model.js";
import { strict } from "./type-class/partial-eq.js";

test("mahjong", () => {
    const suitDigit = Model.union(Model.num, strict())(
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
    );
    const suitKind = Model.union(Model.str, strict())(
        "Dots",
        "Bamboo",
        "Chars",
    );
    const wind = Model.union(Model.str, strict())(
        "East",
        "South",
        "West",
        "North",
    );
    const dragon = Model.union(Model.str, strict())("White", "Green", "Red");

    const tileFace = Model.enums({
        suit: Model.rec({ kind: suitKind, digit: suitDigit }),
        wind,
        dragon,
    });
    const tile = Model.rec({
        face: tileFace,
        isRed: Model.bool,
    });

    const seatPosition = Model.union(Model.num, strict())(1, 2, 3, 4);

    const meld = Model.enums({
        // 刻子
        pung: Model.tuple(tile, tile, tile),
        // 順子
        chow: Model.tuple(tile, tile, tile),
        // 槓子
        kong: Model.tuple(tile, tile, tile, tile),
        // 雀頭
        eyes: Model.tuple(tile, tile),
    });
    const exposedMeld = Model.rec({
        meld,
        stolenFrom: seatPosition,
    });

    const user = Model.entity({
        name: Model.str,
        email: Model.str,
        passwordHash: Model.str,
        passwordSalt: Model.str,
        rank: Model.num,
        rankProgress: Model.num,
        penalty: Model.num,
    });
    const player = Model.rec({
        user: Model.reference(user),
        points: Model.int,
        exposed: Model.array(exposedMeld),
        hands: Model.array(tile),
    });

    const playerActionDid = Model.enums({
        discard: tile,
        steal: exposedMeld,
    });
    const playerAction = Model.rec({
        who: seatPosition,
        did: playerActionDid,
    });

    const gameLog = Model.rec({
        seed: Model.int,
        actions: Model.array(playerAction),
    });

    const game = Model.rec({
        players: Model.tuple(player, player, player, player),
        dealer: seatPosition,
        round: Model.int,
        extraRound: Model.int,
        depositThousands: Model.int,
        deck: Model.array(tile),
        log: Model.array(gameLog),
    });

    expect(
        game.validate({
            players: [
                {
                    user: "001",
                    points: 25000n,
                    exposed: [],
                    hands: [],
                },
                {
                    user: "002",
                    points: 25000n,
                    exposed: [],
                    hands: [],
                },
                {
                    user: "003",
                    points: 25000n,
                    exposed: [],
                    hands: [],
                },
                {
                    user: "004",
                    points: 25000n,
                    exposed: [],
                    hands: [],
                },
            ],
            dealer: 1,
            round: 1n,
            extraRound: 0n,
            depositThousands: 0n,
            deck: [],
            log: [],
        }),
    ).toStrictEqual(true);
});

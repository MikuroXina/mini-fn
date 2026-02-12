import { expect, test } from "vitest";
import * as Model from "./model.js";
import * as Option from "./option.js";
import * as Result from "./result.js";
import * as Serial from "./serial.js";
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

    const user001 = Model.newEntity(user)({
        name: "john",
        email: "john@example.com",
        passwordHash: "deadbeef",
        passwordSalt: "with-salt",
        rank: 1,
        rankProgress: 100,
        penalty: 0,
    })("001")(Model.newModel(Model.dateUtc)("2020-01-01T09:00:00.000Z"));
    expect(user.validate(user001)).toStrictEqual(true);

    expect(
        game.validate({
            players: [
                {
                    user: Model.newRef(user001),
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

test("newModel", () => {
    expect(Model.newModel(Model.str)("52")).toStrictEqual("52");
    expect(() => Model.newModel(Model.str)(52)).toThrow();
});

test("bool", () => {
    // clone
    for (const b of [false, true]) {
        const c = Model.bool.clone(b);
        expect(b).toStrictEqual(c);
    }

    // validate
    expect(Model.bool.validate(false)).toStrictEqual(true);
    expect(Model.bool.validate(true)).toStrictEqual(true);
    expect(Model.bool.validate(42)).toStrictEqual(false);
    expect(Model.bool.validate({})).toStrictEqual(false);

    // encode and decode
    for (const b of [false, true]) {
        const code = Serial.runCode(Model.bool.encoder(b));
        const decoded = Result.unwrap(
            Serial.runDecoder(Model.bool.decoder)(code),
        );
        expect(b).toStrictEqual(decoded);
        const code2 = Serial.runCode(Model.bool.encoder(decoded));
        expect(code).toStrictEqual(code2);
    }
});

test("int", () => {
    // clone
    for (let x = -10n; x <= 10n; ++x) {
        const y = Model.int.clone(x);
        expect(x).toStrictEqual(y);
    }

    // validate
    expect(Model.int.validate(3n)).toStrictEqual(true);
    expect(Model.int.validate(0n)).toStrictEqual(true);
    expect(Model.int.validate(-8n)).toStrictEqual(true);
    expect(Model.int.validate(42)).toStrictEqual(false);
    expect(Model.int.validate({})).toStrictEqual(false);

    // encode and decode
    for (let x = -10n; x <= 10n; ++x) {
        const code = Serial.runCode(Model.int.encoder(x));
        const decoded = Result.unwrap(
            Serial.runDecoder(Model.int.decoder)(code),
        );
        expect(x).toStrictEqual(decoded);
        const code2 = Serial.runCode(Model.int.encoder(decoded));
        expect(code).toStrictEqual(code2);
    }
});

test("str", () => {
    // clone
    for (const x of ["", "foo", "quuuux"]) {
        const y = Model.str.clone(x);
        expect(x).toStrictEqual(y);
    }

    // validate
    expect(Model.str.validate("x")).toStrictEqual(true);
    expect(Model.str.validate("foo")).toStrictEqual(true);
    expect(Model.str.validate("")).toStrictEqual(true);
    expect(Model.str.validate(42)).toStrictEqual(false);
    expect(Model.str.validate({})).toStrictEqual(false);

    // encode and decode
    for (const x of ["", "foo", "quuuux"]) {
        const code = Serial.runCode(Model.str.encoder(x));
        const decoded = Result.unwrap(
            Serial.runDecoder(Model.str.decoder)(code),
        );
        expect(x).toStrictEqual(decoded);
        const code2 = Serial.runCode(Model.str.encoder(decoded));
        expect(code).toStrictEqual(code2);
    }
});

test("lit", () => {
    const m = Model.lit(42);
    // validate
    expect(m.validate(42)).toStrictEqual(true);
    expect(m.validate(41)).toStrictEqual(false);
    expect(m.validate(43)).toStrictEqual(false);
    expect(m.validate("42")).toStrictEqual(false);
    expect(m.validate({})).toStrictEqual(false);

    expect(() => Model.lit(false as unknown as number)).toThrow();
});

test("array", () => {
    const m = Model.array(Model.num);
    // clone
    const x = [1, 4, 2];
    const y = m.clone(x);
    x.push(3);
    expect(y).toStrictEqual([1, 4, 2]);

    // validate
    expect(m.validate([2, 1, 8])).toStrictEqual(true);
    expect(m.validate([])).toStrictEqual(true);
    expect(m.validate(1)).toStrictEqual(false);
    expect(m.validate({})).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(m.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(m.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(m.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("tuple", () => {
    const m = Model.tuple(Model.num, Model.int, Model.str);
    // clone
    const x: [number, bigint, string] = [8, -12n, "666"];
    const y = m.clone(x);
    x[1] = -23n;
    expect(y).toStrictEqual([8, -12n, "666"]);

    // validate
    expect(m.validate(x)).toStrictEqual(true);
    expect(m.validate(y)).toStrictEqual(true);
    expect(m.validate([11, 3n, "999", 7])).toStrictEqual(false);
    expect(m.validate([11, 3n])).toStrictEqual(false);
    expect(m.validate([11])).toStrictEqual(false);
    expect(m.validate([])).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(m.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(m.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(m.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("enums", () => {
    const m = Model.enums({
        cancel: Model.unit,
        move: Model.rec({ x: Model.num, y: Model.num }),
        setColor: Model.tuple(Model.num, Model.num, Model.num),
    });

    // clone
    const x = { type: "move" as const, value: { x: 4, y: -3 } };
    const y = m.clone(x);
    x.value.x += 4;
    expect(y).toStrictEqual({ type: "move", value: { x: 4, y: -3 } });

    // validate
    expect(m.validate({ type: "cancel", value: [] })).toStrictEqual(true);
    expect(m.validate({ type: "move", value: { x: -10, y: 0 } })).toStrictEqual(
        true,
    );
    expect(m.validate({ type: "setColor", value: [10, 11, 13] })).toStrictEqual(
        true,
    );
    expect(m.validate({ type: "cancel", value: [8] })).toStrictEqual(false);
    expect(
        m.validate({ type: "move", value: { x: -10n, y: 6 } }),
    ).toStrictEqual(false);
    expect(m.validate({ type: "setColor", value: [11, 13] })).toStrictEqual(
        false,
    );
    expect(m.validate({ type: "moev", value: { x: 10, y: -3 } })).toStrictEqual(
        false,
    );

    // encode and decode
    const code = Serial.runCode(m.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(m.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(m.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("flags", () => {
    expect(() => Model.flags("x", "y", "x")).toThrow();

    const m = Model.flags("x", "y", "z");
    // clone
    const x = { x: false, y: true, z: false };
    const y = m.clone(x);
    x.z = true;
    expect(y).toStrictEqual({ x: false, y: true, z: false });

    // validate
    expect(m.validate({ x: false, y: false, z: false })).toStrictEqual(true);
    expect(m.validate({ x: 0, y: false, z: 1n })).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(m.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(m.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(m.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("option", () => {
    const m = Model.option(Model.rec({ x: Model.num }));
    // clone
    const x = Option.some({ x: 2 });
    const y = m.clone(x);
    expect(x).toStrictEqual(y);

    // validate
    expect(m.validate(Option.some({ x: 42 }))).toStrictEqual(true);
    expect(m.validate(Option.some({ x: -800 }))).toStrictEqual(true);
    expect(m.validate(Option.some({ x: "sss" }))).toStrictEqual(false);
    expect(m.validate([[], { x: 3 }])).toStrictEqual(false);
    expect(m.validate({ x: 3 })).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(m.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(m.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(m.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("unit", () => {
    // clone
    const x: never[] = [];
    const y = Model.unit.clone(x);
    expect(x).toStrictEqual(y);

    // validate
    expect(Model.unit.validate([])).toStrictEqual(true);
    expect(Model.unit.validate(1)).toStrictEqual(false);
    expect(Model.unit.validate({})).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(Model.unit.encoder(x));
    const decoded = Result.unwrap(Serial.runDecoder(Model.unit.decoder)(code));
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(Model.unit.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

test("never", () => {
    const m = Model.never as unknown as Model.Model<unknown>;
    // clone
    expect(() => m.clone({})).toThrow();

    // validate
    expect(m.validate(2)).toStrictEqual(false);
    expect(m.validate(4n)).toStrictEqual(false);
    expect(m.validate("11")).toStrictEqual(false);
    expect(m.validate(undefined)).toStrictEqual(false);
    expect(m.validate(null)).toStrictEqual(false);
    expect(m.validate([])).toStrictEqual(false);
    expect(m.validate({})).toStrictEqual(false);

    // encode and decode
    expect(() => m.encoder({})).toThrow();
    expect(() => Serial.runDecoder(m.decoder)(new ArrayBuffer())).toThrow();
});

test("dateUtc", () => {
    // clone
    const x = new Date().toISOString() as Model.DateUtc;
    const y = Model.dateUtc.clone(x);
    expect(x).toStrictEqual(y);

    // validate
    expect(Model.dateUtc.validate(x)).toStrictEqual(true);
    expect(Model.dateUtc.validate(x)).toStrictEqual(true); // validate twice to check whether stateless
    expect(Model.dateUtc.validate(2020)).toStrictEqual(false);
    expect(Model.dateUtc.validate({})).toStrictEqual(false);

    // encode and decode
    const code = Serial.runCode(Model.dateUtc.encoder(x));
    const decoded = Result.unwrap(
        Serial.runDecoder(Model.dateUtc.decoder)(code),
    );
    expect(x).toStrictEqual(decoded);
    const code2 = Serial.runCode(Model.dateUtc.encoder(decoded));
    expect(code).toStrictEqual(code2);
});

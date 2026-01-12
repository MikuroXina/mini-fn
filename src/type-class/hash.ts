import { doT } from "../cat.ts";
import { unwrap } from "../result.ts";
import {
    decU16Le,
    decU32Le,
    decU64Le,
    decU8,
    type Encoder,
    encF64Le,
    monadForDecoder,
    runCode,
    runDecoder,
    skip,
} from "../serial.ts";
import type { Eq } from "./eq.ts";
import { nonNanOrd } from "./ord.ts";

export type Hash<T> = Eq<T> & {
    readonly hash: (self: T) => (hasher: Hasher) => Hasher;
};

export const nonNanHash: Hash<number> = {
    ...nonNanOrd,
    hash: (self) => (hasher) => {
        if (Number.isNaN(self)) {
            throw new Error("NaN is not allowed for this hash impl");
        }
        return hasher.write(runCode(encF64Le(self)));
    },
};
export const fromEncoder =
    <T>(equality: Eq<T>) => (encoder: Encoder<T>): Hash<T> => ({
        ...equality,
        hash: (self) => (hasher) => hasher.write(runCode(encoder(self))),
    });

export type Hasher = Readonly<{
    state: () => bigint;
    write: (bytes: ArrayBuffer) => Hasher;
}>;

type SipState = [v0: bigint, v1: bigint, v2: bigint, v3: bigint];

const wrappingAddU64 = (a: bigint, b: bigint): bigint =>
    BigInt.asUintN(64, a + b);
const rotateLeftU64 = (v: bigint, amount: number): bigint =>
    BigInt.asUintN(64, (v << BigInt(amount)) | (v >> BigInt(64 - amount)));
const compress = ([v0, v1, v2, v3]: SipState): SipState => {
    v0 = wrappingAddU64(v0, v1);
    v1 = rotateLeftU64(v1, 13);
    v1 ^= v0;
    v0 = rotateLeftU64(v0, 32);
    v2 = wrappingAddU64(v2, v3);
    v3 = rotateLeftU64(v3, 16);
    v3 ^= v2;
    v0 = wrappingAddU64(v0, v3);
    v3 = rotateLeftU64(v3, 21);
    v3 ^= v0;
    v2 = wrappingAddU64(v2, v1);
    v1 ^= v2;
    v2 = rotateLeftU64(v2, 32);
    return [v0, v1, v2, v3];
};
const cRounds: (state: SipState) => SipState = compress;
const dRounds = (state: SipState): SipState =>
    compress(compress(compress(state)));
const reset = (
    k0: bigint,
    k1: bigint,
): SipState => [
    k0 ^ 0x736f6d6570736575n,
    k1 ^ 0x646f72616e646f6dn,
    k0 ^ 0x6c7967656e657261n,
    k1 ^ 0x7465646279746573n,
];

type SipHasher = {
    k0: bigint;
    k1: bigint;
    length: number;
    state: SipState;
    tail: bigint;
    nTail: number;
};
const newSip13: SipHasher = {
    k0: 0n,
    k1: 0n,
    length: 0,
    state: reset(0n, 0n),
    tail: 0n,
    nTail: 0,
};

const loadIntLe = (
    bytes: ArrayBuffer,
    index: number,
    bits: number,
): bigint =>
    unwrap(
        runDecoder(
            doT(monadForDecoder)
                .run(skip(index))
                .finishM(() => {
                    switch (bits) {
                        case 8:
                            return monadForDecoder.map(BigInt)(decU8());
                        case 16:
                            return monadForDecoder.map(BigInt)(decU16Le());
                        case 32:
                            return monadForDecoder.map(BigInt)(decU32Le());
                        case 64:
                            return decU64Le();
                        default:
                            throw new Error("unexpected bits");
                    }
                }),
        )(bytes),
    );

const bytesToBigIntLe = (
    bytes: ArrayBuffer,
    start: number,
    len: number,
): bigint => {
    let i = 0;
    let out = 0n;
    if (i + 3 < len) {
        out |= loadIntLe(bytes, start + i, 32);
        i += 4;
    }
    if (i + 1 < len) {
        out |= loadIntLe(bytes, start + i, 16) << BigInt(i * 8);
        i += 2;
    }
    if (i < len) {
        out |= loadIntLe(bytes, start + i, 8) << BigInt(i * 8);
        i += 1;
    }
    return out;
};

/**
 * The default hasher implementation. It uses [SipHash 1-3](https://131002.net/siphash).
 */
export const defaultHasher = (sipHasher: SipHasher = newSip13): Hasher => ({
    state: () => {
        let state = sipHasher.state;
        const { length, tail } = sipHasher;
        const base = ((BigInt(length) & 0xffn) << 56n) | tail;

        state[3] ^= base;
        state = cRounds(state);
        state[0] ^= base;

        state[2] ^= 0xffn;
        state = dRounds(state);

        return state[0] ^ state[1] ^ state[2] ^ state[3];
    },
    write: (bytes) => {
        const length = bytes.byteLength;
        const next: SipHasher = { ...sipHasher, state: [...sipHasher.state] };
        next.length += length;
        let needed = 0;
        if (next.nTail !== 0) {
            needed = 8 - next.nTail;
            next.tail |= bytesToBigIntLe(bytes, 0, Math.min(length, needed)) <<
                (8n * BigInt(next.nTail));
            if (length < needed) {
                next.nTail += length;
                return defaultHasher(next);
            }
            next.state[3] ^= next.tail;
            next.state = cRounds(next.state);
            next.state[0] ^= next.tail;
            next.nTail = 0;
        }

        const len = length - needed;
        const left = len % 8;
        let i = needed;
        for (; i < len - left; i += 8) {
            const mi = loadIntLe(bytes, i, 64);
            next.state[3] ^= mi;
            next.state = cRounds(next.state);
            next.state[0] ^= mi;
        }
        next.tail = bytesToBigIntLe(bytes, i, left);
        next.nTail = left;
        return defaultHasher(next);
    },
});

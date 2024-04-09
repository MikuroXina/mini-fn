import type { Serialize } from "./serialize.ts";
import type { Hkt2 } from "./hkt.ts";
import type { Deserialize } from "./deserialize.ts";
import { map } from "./result.ts";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Tagged<S, B> {
    readonly value: B;
}

export const tagged = <S, B>(value: B): Tagged<S, B> => ({ value });

export const unTagged = <S, B>({ value }: Tagged<S, B>) => value;

export interface TaggedHkt extends Hkt2 {
    readonly type: Tagged<this["arg2"], this["arg1"]>;
}

export const serialize =
    <S, B>(serializeB: Serialize<B>): Serialize<Tagged<S, B>> => (v) =>
        serializeB(v.value);

export const deserialize =
    <S, B>(deserialize: Deserialize<B>): Deserialize<Tagged<S, B>> => (de) =>
        map(tagged<S, B>)(deserialize(de));

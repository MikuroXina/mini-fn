import type { Hkt2 } from "./hkt.ts";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Tagged<S, B> {
    readonly value: B;
}

export const tagged = <S, B>(value: B): Tagged<S, B> => ({ value });

export const unTagged = <S, B>(t: Tagged<S, B>) => t.value;

export interface TaggedHkt extends Hkt2 {
    readonly type: Tagged<this["arg2"], this["arg1"]>;
}

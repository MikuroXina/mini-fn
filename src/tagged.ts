import type { Hkt2 } from "./hkt.js";

export type Tagged<_S, B> = {
    readonly value: B;
};

export const tagged = <S, B>(value: B): Tagged<S, B> => ({ value });

export const unTagged = <S, B>(t: Tagged<S, B>) => t.value;

export interface TaggedHkt extends Hkt2 {
    readonly type: Tagged<this["arg2"], this["arg1"]>;
}

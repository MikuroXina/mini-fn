import { id } from "../func.ts";
import type { Get1, Hkt2 } from "../hkt.ts";
import type { Category } from "./category.ts";
import type { Monoid } from "./monoid.ts";
import { type SemiGroup, semiGroupSymbol } from "./semi-group.ts";

export type NaturalTransformation<F, G> = <T>(f: Get1<F, T>) => Get1<G, T>;

export interface Nt<F, G> {
    readonly nt: NaturalTransformation<F, G>;
}

export interface NtHkt extends Hkt2 {
    readonly type: Nt<this["arg2"], this["arg1"]>;
}

export const category: Category<NtHkt> = {
    identity: () => ({ nt: id }),
    compose:
        <B, C>({ nt: ntBC }: Nt<B, C>) =>
        <A>({ nt: ntAB }: Nt<A, B>): Nt<A, C> => ({ nt: (f) => ntBC(ntAB(f)) }),
};

export const semiGroup = <F>(): SemiGroup<Nt<F, F>> => ({
    combine: ({ nt: ntA }, { nt: ntB }) => ({
        nt: (f) => ntB(ntA(f)),
    }),
    [semiGroupSymbol]: true,
});

export const monoid = <F>(): Monoid<Nt<F, F>> => ({
    combine: ({ nt: ntA }, { nt: ntB }) => ({
        nt: (f) => ntB(ntA(f)),
    }),
    identity: { nt: id },
    [semiGroupSymbol]: true,
});

export interface Transformation<F, G, T> {
    readonly transform: (t: T) => <A>(fa: Get1<F, A>) => Get1<G, A>;
}

export const transformation = <F, G>(): Transformation<F, G, Nt<F, G>> => ({
    transform: ({ nt }) => nt,
});

export const wrap = <F, G>(nt: NaturalTransformation<F, G>): Nt<F, G> => ({
    nt,
});

export const unwrap = <F, G, T>({ transform }: Transformation<F, G, T>) =>
    transform;

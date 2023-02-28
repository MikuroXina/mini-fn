import type { Get2, Hkt2 } from "../hkt.js";

import type { SemiGroupoid } from "./semi-groupoid.js";

export interface Category<S> extends SemiGroupoid<S> {
    readonly identity: <A>() => Get2<S, A, A>;
}

export const compose = <S extends Hkt2>(
    cat: Category<S>,
): (<B, C>(bc: Get2<S, B, C>) => <A>(ab: Get2<S, A, B>) => Get2<S, A, C>) => cat.compose;

export const pipe =
    <S extends Hkt2>(cat: Category<S>) =>
    <A, B>(bc: Get2<S, A, B>) =>
    <C>(ab: Get2<S, B, C>): Get2<S, A, C> =>
        cat.compose(ab)(bc);

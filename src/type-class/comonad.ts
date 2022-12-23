import type { Functor, Functor1, Functor2 } from "./functor.js";
import type { GetHktA1, GetHktA2, Hkt } from "../hkt.js";

export interface Comonad<W extends symbol> extends Functor<W> {
    extract: <A>(wa: Hkt<W, A>) => A;
    duplicate: <A>(wa: Hkt<W, A>) => Hkt<W, Hkt<W, A>>;
}

export interface Comonad1<W> extends Functor1<W> {
    extract: <A>(wa: GetHktA1<W, A>) => A;
    duplicate: <A>(wa: GetHktA1<W, A>) => GetHktA1<W, GetHktA1<W, A>>;
}
export interface Comonad2<W> extends Functor2<W> {
    extract: <B, A>(wa: GetHktA2<W, B, A>) => A;
    duplicate: <B, A>(wa: GetHktA2<W, B, A>) => GetHktA2<W, B, GetHktA2<W, B, A>>;
}

export function extend<W>(
    comonad: Comonad1<W>,
): <A1, A2>(extension: (wa: GetHktA1<W, A1>) => A2) => (wa: GetHktA1<W, A1>) => GetHktA1<W, A2>;
export function extend<W>(
    comonad: Comonad2<W>,
): <A1, A2, B>(
    extension: (wa: GetHktA2<W, B, A1>) => A2,
) => (wa: GetHktA2<W, B, A1>) => GetHktA2<W, B, A2>;
export function extend<W extends symbol>(
    comonad: Comonad<W>,
): <A1, A2>(extension: (wa: Hkt<W, A1>) => A2) => (wa: Hkt<W, A1>) => Hkt<W, A2> {
    return (extension) => (wa) => comonad.map(extension)(comonad.duplicate(wa));
}

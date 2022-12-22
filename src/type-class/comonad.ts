import type { Functor, Functor1 } from "./functor.js";
import type { GetHktA1, Hkt } from "../hkt.js";

export interface Comonad<W extends symbol> extends Functor<W> {
    extract: <A>(wa: Hkt<W, A>) => A;
    duplicate: <A>(wa: Hkt<W, A>) => Hkt<W, Hkt<W, A>>;
}

export interface Comonad1<W> extends Functor1<W> {
    extract: <A>(wa: GetHktA1<W, A>) => A;
    duplicate: <A>(wa: GetHktA1<W, A>) => GetHktA1<W, GetHktA1<W, A>>;
}

export function extend<W>(
    comonad: Comonad1<W>,
): <A, B>(extension: (wa: GetHktA1<W, A>) => B) => (wa: GetHktA1<W, A>) => GetHktA1<W, B>;
export function extend<W extends symbol>(
    comonad: Comonad<W>,
): <A, B>(extension: (wa: Hkt<W, A>) => B) => (wa: Hkt<W, A>) => Hkt<W, B> {
    return (extension) => (wa) => comonad.map(extension)(comonad.duplicate(wa));
}

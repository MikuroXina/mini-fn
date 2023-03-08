import { compose } from "../func.js";
import type { Get1 } from "../hkt.js";
import type { Functor } from "./functor.js";

export interface Comonad<W> extends Functor<W> {
    readonly extract: <A>(wa: Get1<W, A>) => A;
    readonly duplicate: <A>(wa: Get1<W, A>) => Get1<W, Get1<W, A>>;
}

export const extend =
    <W>(comonad: Comonad<W>) =>
    <A1, A2>(extension: (wa: Get1<W, A1>) => A2): ((wa: Get1<W, A1>) => Get1<W, A2>) =>
        compose(comonad.map(extension))(comonad.duplicate);

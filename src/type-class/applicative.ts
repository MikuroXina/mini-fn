import { Apply, Apply1, Apply2, Apply2Monoid, Apply3, Apply4, makeSemiGroup } from "./apply";
import type { Hkt, HktKeyA1, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";
import type { Pure, Pure1, Pure2, Pure2Monoid, Pure3, Pure4 } from "./pure";

import type { Monoid } from "./monoid";

export interface Applicative<Sym extends symbol> extends Apply<Sym>, Pure<Sym> {}

export interface Applicative1<S extends HktKeyA1> extends Apply1<S>, Pure1<S> {}
export interface Applicative2<S extends HktKeyA2> extends Apply2<S>, Pure2<S> {}
export interface Applicative2Monoid<S extends HktKeyA2, M>
    extends Apply2Monoid<S, M>,
        Pure2Monoid<S, M> {}
export interface Applicative3<S extends HktKeyA3> extends Apply3<S>, Pure3<S> {}
export interface Applicative4<S extends HktKeyA4> extends Apply4<S>, Pure4<S> {}

export const makeMonoid = <Sym extends symbol>(app: Applicative<Sym>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Hkt<Sym, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
    });
};

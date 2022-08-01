import type { Hkt, HktA1, HktA2, HktA3, HktA4 } from "../hkt";
import { Apply, Apply1, Apply2, Apply3, Apply4, makeSemiGroup } from "./apply";
import type { Pure, Pure1, Pure2, Pure3, Pure4 } from "./pure";
import type { Monoid } from "./monoid";

export interface Applicative<Symbol extends symbol> extends Apply<Symbol>, Pure<Symbol> {}

export interface Applicative1<A extends HktA1> extends Apply1<A>, Pure1<A> {}
export interface Applicative2<A extends HktA2> extends Apply2<A>, Pure2<A> {}
export interface Applicative3<A extends HktA3> extends Apply3<A>, Pure3<A> {}
export interface Applicative4<A extends HktA4> extends Apply4<A>, Pure4<A> {}

export const makeMonoid = <Symbol extends symbol>(app: Applicative<Symbol>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Hkt<Symbol, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
    });
};

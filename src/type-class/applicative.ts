import { pipe } from "../func.js";
import type { Get1 } from "../hkt.js";
import { type Apply, makeSemiGroup } from "./apply.js";
import type { Monoid } from "./monoid.js";
import type { Pure } from "./pure.js";
import { semiGroupSymbol } from "./semi-group.js";
import { type Contravariant, phantom } from "./variance.js";

export interface Applicative<S> extends Apply<S>, Pure<S> {}

export const noEffect = <F, A>(app: Applicative<F>, contra: Contravariant<F>): Get1<F, A> =>
    phantom(app, contra)(app.pure<void>(undefined));

export const makeMonoid = <S>(app: Applicative<S>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Get1<S, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
        [semiGroupSymbol]: true,
    });
};

export const liftA2 =
    <S>(app: Applicative<S>) =>
    <A, B, C>(f: (a: A) => (b: B) => C): ((x: Get1<S, A>) => (y: Get1<S, B>) => Get1<S, C>) =>
        pipe(app.map(f))(app.apply);

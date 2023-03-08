import { pipe } from "../func.js";
import type { Get1, Hkt1 } from "../hkt.js";
import { Apply, makeSemiGroup } from "./apply.js";
import type { Monoid } from "./monoid.js";
import type { Pure } from "./pure.js";

export interface Applicative<S> extends Apply<S>, Pure<S> {}

export const makeMonoid = <S extends Hkt1>(app: Applicative<S>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Get1<S, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
    });
};

export const liftA2 =
    <S extends Hkt1>(app: Applicative<S>) =>
    <A, B, C>(f: (a: A) => (b: B) => C): ((x: Get1<S, A>) => (y: Get1<S, B>) => Get1<S, C>) =>
        pipe(app.map(f))(app.apply);

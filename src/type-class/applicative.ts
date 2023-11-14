import { pipe } from "../func.ts";
import type { Get1 } from "../hkt.ts";
import { type Apply, makeSemiGroup } from "./apply.ts";
import type { Monoid } from "./monoid.ts";
import type { Pure } from "./pure.ts";
import { semiGroupSymbol } from "./semi-group.ts";

export interface Applicative<S> extends Apply<S>, Pure<S> {}

export const makeMonoid = <S>(app: Applicative<S>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Get1<S, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
        [semiGroupSymbol]: true,
    });
};

export const liftA2 = <S>(app: Applicative<S>) =>
<A, B, C>(
    f: (a: A) => (b: B) => C,
): (x: Get1<S, A>) => (y: Get1<S, B>) => Get1<S, C> =>
    pipe(app.map(f))(app.apply);

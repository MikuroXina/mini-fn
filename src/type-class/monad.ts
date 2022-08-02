import type { HktKeyA1, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";
import type {
    Applicative1,
    Applicative2,
    Applicative2Monoid,
    Applicative3,
    Applicative4,
} from "./applicative";
import type { FlatMap1, FlatMap2, FlatMap2Monoid, FlatMap3, FlatMap4 } from "./flat-map";

export interface Monad1<S extends HktKeyA1> extends Applicative1<S>, FlatMap1<S> {}
export interface Monad2<S extends HktKeyA2> extends Applicative2<S>, FlatMap2<S> {}
export interface Monad2Monoid<S extends HktKeyA2, M>
    extends Applicative2Monoid<S, M>,
        FlatMap2Monoid<S, M> {}
export interface Monad3<S extends HktKeyA3> extends Applicative3<S>, FlatMap3<S> {}
export interface Monad4<S extends HktKeyA4> extends Applicative4<S>, FlatMap4<S> {}

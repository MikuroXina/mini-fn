import type { HktA1, HktA2, HktA3, HktA4 } from "../hkt";
import type { Applicative1, Applicative2, Applicative3, Applicative4 } from "./applicative";
import type { FlatMap1, FlatMap2, FlatMap3, FlatMap4 } from "./flat-map";

export interface Monad1<A extends HktA1> extends Applicative1<A>, FlatMap1<A> {}
export interface Monad2<A extends HktA2> extends Applicative2<A>, FlatMap2<A> {}
export interface Monad3<A extends HktA3> extends Applicative3<A>, FlatMap3<A> {}
export interface Monad4<A extends HktA4> extends Applicative4<A>, FlatMap4<A> {}

import type { HktA1, HktA2, HktA3, HktA4 } from "../hkt";
import type { Apply1, Apply2, Apply3, Apply4 } from "./apply";
import type { Pure1, Pure2, Pure3, Pure4 } from "./pure";

export interface Applicative1<A extends HktA1> extends Apply1<A>, Pure1<A> {}
export interface Applicative2<A extends HktA2> extends Apply2<A>, Pure2<A> {}
export interface Applicative3<A extends HktA3> extends Apply3<A>, Pure3<A> {}
export interface Applicative4<A extends HktA4> extends Apply4<A>, Pure4<A> {}

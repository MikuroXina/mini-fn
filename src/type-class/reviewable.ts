import type { Bifunctor } from "./bifunctor.js";
import type { Profunctor } from "./profunctor.js";

export type Reviewable<P> = Profunctor<P> & Bifunctor<P>;

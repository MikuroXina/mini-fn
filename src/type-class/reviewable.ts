import type { Bifunctor } from "./bifunctor.ts";
import type { Profunctor } from "./profunctor.ts";

export type Reviewable<P> = Profunctor<P> & Bifunctor<P>;

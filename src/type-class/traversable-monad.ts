import type { Monad } from "./monad.ts";
import type { Traversable } from "./traversable.ts";

export type TraversableMonad<T> = Traversable<T> & Monad<T>;

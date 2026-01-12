import type { Monad } from "./monad.js";
import type { Traversable } from "./traversable.js";

export type TraversableMonad<T> = Traversable<T> & Monad<T>;

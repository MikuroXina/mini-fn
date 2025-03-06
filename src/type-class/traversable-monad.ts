import type { Monad } from "./monad.js";
import type { Traversable } from "./traversable.js";

/**
 * A structure which can be traversed with {@link TypeClass.Traversable.Traversable | `Traversable`} and also composable with {@link TypeClass.Monad.Monad | `Monad`}.
 */
export type TraversableMonad<T> = Traversable<T> & Monad<T>;

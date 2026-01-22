import type { Alternative } from "./alternative.js";
import type { Monad } from "./monad.js";

/**
 * A monad with monoid-ish combine operation.
 */
export interface MonadPlus<M> extends Monad<M>, Alternative<M> {}

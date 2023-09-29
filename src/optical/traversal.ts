import { type Cont, type ContTHkt, monad } from "../cont.js";
import type { Apply2Only, Apply3Only, Get1 } from "../hkt.js";
import type { IdentityHkt } from "../identity.js";
import type { Optic } from "../optical.js";
import { type Traversable } from "../type-class/traversable.js";

export type Traversal<T, A, B> = Optic<Get1<T, A>, Get1<T, B>, A, B>;

export const traversed =
    <T, A, B>(tra: Traversable<T>): Traversal<T, A, B> =>
    <R>(next: (sending: A) => Cont<R, B>) =>
    (received) =>
        tra.traverse<Apply3Only<ContTHkt, R> & Apply2Only<ContTHkt, IdentityHkt>>(monad())(next)(
            received,
        );

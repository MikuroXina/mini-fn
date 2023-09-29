/**
 * @packageDocumentation
 * Traversing combinator for a data structure.
 * ```text
 *    T<A> -----|--[ get ]-> A
 *              V
 * F<T<B>> <-[ set ]-------- F<B>
 * ```
 */

import { type Cont, type ContHkt, map, monad } from "../cont.js";
import type { Apply2Only, Get1, Get2 } from "../hkt.js";
import type { IdentityHkt } from "../identity.js";
import { Identity } from "../lib.js";
import type { Optic } from "../optical.js";
import type { Applicative } from "../type-class/applicative.js";
import { bisequenceA, type Bitraversable } from "../type-class/bitraversable.js";
import { sequenceA, type Traversable } from "../type-class/traversable.js";

export type Traversal<T, F, A, B> = Optic<Get1<T, A>, Get1<F, Get1<T, B>>, A, Get1<F, B>>;
export type Bitraversal<T, F, A, B> = Optic<Get2<T, A, A>, Get1<F, Get2<T, B, B>>, A, Get1<F, B>>;

export const newTraversal =
    <T, F, A, B>(tra: Traversable<T>, app: Applicative<F>): Traversal<T, F, A, B> =>
    <R>(next: (sending: A) => Cont<R, Get1<F, B>>) =>
    (received) =>
        map(sequenceA(tra, app))(tra.traverse<Apply2Only<ContHkt, R>>(monad())(next)(received));

export const newBitraversal =
    <T, F, A, B>(tra: Bitraversable<T>, app: Applicative<F>): Bitraversal<T, F, A, B> =>
    <R>(next: (sending: A) => Cont<R, Get1<F, B>>) =>
    (received: Get2<T, A, A>): Cont<R, Get1<F, Get2<T, B, B>>> =>
        map(bisequenceA(tra, app)<B, B>)(
            tra.bitraverse<Apply2Only<ContHkt, R>>(monad())(next)(next)(received),
        );

export const traversed = <T, A, B>(tra: Traversable<T>): Traversal<T, IdentityHkt, A, B> =>
    newTraversal<T, IdentityHkt, A, B>(tra, Identity.monad);

export const both = <T, A, B>(tra: Bitraversable<T>): Bitraversal<T, IdentityHkt, A, B> =>
    newBitraversal<T, IdentityHkt, A, B>(tra, Identity.monad);

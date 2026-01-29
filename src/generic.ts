/**
 * This module provides the abstraction of ADTs (algebraic data types).
 *
 * @module
 * @packageDocumentation
 */

import type { Get1, Hkt0, Hkt1, Instance } from "./hkt.js";
import { type Eq, eqSymbol } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Ord } from "./type-class/ord.js";
import type { PartialEq } from "./type-class/partial-eq.js";
import type { PartialOrd } from "./type-class/partial-ord.js";
import { type SemiGroup, semiGroupSymbol } from "./type-class/semi-group.js";

/**
 * A higher kind type to associate type `repType`.
 */
export interface GenericRepHkt extends Hkt0 {
    readonly repType: Hkt1;
}

/**
 * Gets the associated type `repType` from `F` if it extends a `GenericRepHkt`.
 */
export type GetRep<F, P> = F extends GenericRepHkt
    ? Get1<F["repType"], P>
    : never;

/**
 * Representation translator between `Instance<F>` and its associated `Rep` type.
 *
 * All of implementations must satisfy the following laws:
 *
 * - Left identity: for all `x`; `to(from(x))` equals to `x`.
 * - Right identity: for all `m`; `from(to(m))` equals to `m`.
 */
export interface Generic<F> {
    /**
     * Converts `data` into the meta representation.
     *
     * @param data - To be converted.
     * @returns The corresponding meta representation.
     */
    from: <P>(data: Instance<F>) => GetRep<F, P>;
    /**
     * Converts `rep` into the concrete data.
     *
     * @params rep - To be converted.
     * @returns The corresponding concrete data.
     */
    to: <P>(rep: GetRep<F, P>) => Instance<F>;
}

/**
 * The `SemiGroup` instance for `T` from the `SemiGroup` instance for `Meta<T>`.
 */
export const semiGroup = <F>(
    generic: Generic<F>,
    semi: SemiGroup<GetRep<F, never[]>>,
): SemiGroup<Instance<F>> => ({
    combine: (l, r) =>
        generic.to(semi.combine(generic.from(l), generic.from(r))),
    [semiGroupSymbol]: true,
});

/**
 * The `Monoid` instance for `T` from `Monoid` instance for `Meta<T>`.
 */
export const monoid = <F>(
    generic: Generic<F>,
    mon: Monoid<GetRep<F, never[]>>,
): Monoid<Instance<F>> => ({
    ...semiGroup(generic, mon),
    identity: generic.to(mon.identity),
});

/**
 * Representation translator between kind `F` and its associated `Rep` type.
 *
 * All of implementations must satisfy the following laws:
 *
 * - Left identity: for all `x`; `to(from(x))` equals to `x`.
 * - Right identity: for all `m`; `from(to(m))` equals to `m`.
 */
export interface Generic1<F> {
    /**
     * Converts `data` into the meta representation.
     *
     * @param data - To be converted.
     * @returns The corresponding meta representation.
     */
    from1: <P>(data: Get1<F, P>) => GetRep<F, P>;
    /**
     * Converts `rep` into the concrete data.
     *
     * @params rep - To be converted.
     * @returns The corresponding concrete data.
     */
    to1: <P>(rep: GetRep<F, P>) => Get1<F, P>;
}

/**
 * The `PartialEq` instance for `T` from `PartialEq` instance for `Meta<T>`.
 */
export const partialEq = <F, P>(
    generic: Generic1<F>,
    eq: PartialEq<GetRep<F, P>>,
): PartialEq<Get1<F, P>> => ({
    eq: (l, r) => eq.eq(generic.from1(l), generic.from1(r)),
});

/**
 * The `Eq` instance for `T` from `Eq` instance for `Meta<T>`.
 */
export const eq = <F, P>(
    generic: Generic1<F>,
    eq: Eq<GetRep<F, P>>,
): Eq<Get1<F, P>> => ({
    eq: (l, r) => eq.eq(generic.from1(l), generic.from1(r)),
    [eqSymbol]: true,
});

/**
 * The `PartialOrd` instance for `T` from `PartialOrd` instance for `Meta<T>`.
 */
export const partialOrd = <F, P>(
    generic: Generic1<F>,
    ord: PartialOrd<GetRep<F, P>>,
): PartialOrd<Get1<F, P>> => ({
    eq: (l, r) => ord.eq(generic.from1(l), generic.from1(r)),
    partialCmp: (l, r) => ord.partialCmp(generic.from1(l), generic.from1(r)),
});

/**
 * The `Ord` instance for `T` from `Ord` instance for `Meta<T>`.
 */
export const ord = <F, P>(
    generic: Generic1<F>,
    ord: Ord<GetRep<F, P>>,
): Ord<Get1<F, P>> => ({
    eq: (l, r) => ord.eq(generic.from1(l), generic.from1(r)),
    partialCmp: (l, r) => ord.partialCmp(generic.from1(l), generic.from1(r)),
    cmp: (l, r) => ord.cmp(generic.from1(l), generic.from1(r)),
    [eqSymbol]: true,
});

/**
 * Lifted version of `never`.
 */
export interface Void extends Hkt1 {
    readonly type: never;
    readonly repType: Void;
}

/**
 * The `Generic` instance for `never`.
 */
export const voidGeneric: Generic<Void> = {
    from: (data) => data,
    to: (rep) => rep,
};

/**
 * The `Generic1` instance for `never`.
 */
export const voidGeneric1: Generic1<Void> = {
    from1: (data) => data,
    to1: (rep) => rep,
};

/**
 * Lifted version of `never[]`.
 */
export interface Unit extends Hkt1 {
    readonly type: never[];
    readonly repType: Unit;
}

/**
 * The `Functor` instance for `Unit`.
 */
export const unitFunctor: Functor<Unit> = {
    map: () => () => [],
};

/**
 * The `Generic` instance for `never[]`.
 */
export const unitGeneric: Generic<Unit> = {
    from: (data) => data,
    to: (rep) => rep,
};

/**
 * The `Generic1` instance for `never[]`.
 */
export const unitGeneric1: Generic1<Unit> = {
    from1: (data) => data,
    to1: (rep) => rep,
};

/**
 * A kind of the left side of sum type.
 */
export type SumLeft<F, P> = { kind: "left"; value: Get1<F, P> };
/**
 * A kind of the right side of sum type.
 */
export type SumRight<G, P> = { kind: "right"; value: Get1<G, P> };

/**
 * Lifted version of the sum type.
 */
export interface Sum<F, G> extends Hkt1 {
    readonly type: SumLeft<F, this["arg1"]> | SumRight<G, this["arg1"]>;
    readonly repType: Sum<F, G>;
}

/**
 * The `Functor` instance for `Sum<F, G>` from the `Functor` instances of `F` and `G`.
 */
export const sumFunctor = <F, G>(
    fFunctor: Functor<F>,
    gFunctor: Functor<G>,
): Functor<Sum<F, G>> => ({
    map: (fn) => (t) =>
        t.kind === "left"
            ? { kind: "left", value: fFunctor.map(fn)(t.value) }
            : { kind: "right", value: gFunctor.map(fn)(t.value) },
});

/**
 * The `Generic` instance for the sum type.
 */
export const sumGeneric = <F, G>(): Generic<Sum<F, G>> => ({
    from: (data) => data,
    to: (rep) => rep,
});

/**
 * The `Generic1` instance for the sum type.
 */
export const sumGeneric1 = <F, G>(): Generic1<Sum<F, G>> => ({
    from1: (data) => data,
    to1: (rep) => rep,
});

/**
 * Lifted version of `[A, B]`.
 */
export interface Prod<F, G> extends Hkt1 {
    readonly type: [left: Get1<F, this["arg1"]>, right: Get1<G, this["arg1"]>];
    readonly repType: Prod<F, G>;
}

/**
 * The `Functor` instance for `Prod<F, G>` from the `Functor` instances of `F` and `G`.
 */
export const prodFunctor = <F, G>(
    fFunctor: Functor<F>,
    gFunctor: Functor<G>,
): Functor<Prod<F, G>> => ({
    map: (fn) => (t) => [fFunctor.map(fn)(t[0]), gFunctor.map(fn)(t[1])],
});

/**
 * The `Generic` instance for the product type.
 */
export const prodGeneric = <F, G>(): Generic<Prod<F, G>> => ({
    from: (data) => data,
    to: (rep) => rep,
});

/**
 * The `Generic1` instance for the product type.
 */
export const prodGeneric1 = <F, G>(): Generic1<Prod<F, G>> => ({
    from1: (data) => data,
    to1: (rep) => rep,
});

/**
 * Lifted recursive type `C` without type arguments.
 */
export interface Recurse0<C> extends Hkt1 {
    readonly type: C;
    readonly repType: Recurse0<C>;
}

/**
 * The `Functor` instance for `Recurse0<C>`.
 */
export const recurse0Functor = <C>(): Functor<Recurse0<C>> => ({
    map: () => (c) => c,
});

/**
 * The `Generic` instance for the recursive type.
 */
export const recurse0Generic = <C>(): Generic<Recurse0<C>> => ({
    from: (data) => data,
    to: (rep) => rep,
});

/**
 * The `Generic1` instance for the recursive type.
 */
export const recurse0Generic1 = <C>(): Generic1<Recurse0<C>> => ({
    from1: (data) => data,
    to1: (rep) => rep,
});

/**
 * Gets the type parameter `arg1`.
 */
export interface Parameter1 extends Hkt1 {
    readonly type: this["arg1"];
    readonly repType: Parameter1;
}

/**
 * The `Functor` instance for `Parameter1`.
 */
export const parameter1Functor: Functor<Parameter1> = {
    map: (f) => f,
};

/**
 * The `Generic1` instance for the identity type.
 */
export const parameter1Generic1: Generic1<Parameter1> = {
    from1: (data) => data,
    to1: (rep) => rep,
};

/**
 * Lifted recursion for a kind `F` with a type argument.
 */
export interface Recurse1<F> extends Hkt1 {
    readonly type: Get1<F, this["arg1"]>;
    readonly repType: Recurse1<F>;
}

/**
 * The `Functor` instance for `Recurse<F>` from a `Functor` instance for `F`.
 */
export const recurse1Functor = <F>(f: Functor<F>): Functor<Recurse1<F>> => ({
    map: f.map,
});

/**
 * The `Generic1` instance for the recursive kind.
 */
export const recurse1Generic1 = <F>(): Generic1<Recurse1<F>> => ({
    from1: (data) => data,
    to1: (rep) => rep,
});

/**
 * Lifted composition of functors as `F<G<_>>`.
 */
export interface Compose1<F, G> extends Hkt1 {
    readonly type: Get1<F, Get1<G, this["arg1"]>>;
    readonly repType: Compose1<F, G>;
}

/**
 * The `Generic` instance for composition of functors.
 */
export const recurseGeneric = <F, G>(): Generic<Compose1<F, G>> => ({
    from: (data) => data,
    to: (rep) => rep,
});

/**
 * A wrapped value `F<P>` with the key type `K`.
 */
export interface Keyed<K, F, P> {
    readonly key: K;
    readonly value: Get1<F, P>;
}

/**
 * Wrapper with the key identifier `K`.
 */
export interface Meta<K, F> extends Hkt1 {
    readonly type: Keyed<K, F, this["arg1"]>;
    readonly repType: Meta<K, F>;
}

/**
 * The `Generic` instance for wrapper with a key identifier.
 */
export const metaGeneric = <K, F>(): Generic<Meta<K, F>> => ({
    from: (data) => data,
    to: (rep) => rep,
});

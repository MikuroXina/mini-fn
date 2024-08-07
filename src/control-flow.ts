/**
 * This module provides an utility type `ControlFlow<B, C>`, which tells an operation whether it should exit early or go on.
 *
 * @packageDocumentation
 * @module
 */

import { none, type Option, some } from "./option.ts";
import type { Apply2Only, Hkt2 } from "./hkt.ts";
import type { Applicative } from "./type-class/applicative.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Get1 } from "./hkt.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Traversable } from "./type-class/traversable.ts";
import type { TraversableMonad } from "./type-class/traversable-monad.ts";
import {
    type Decoder,
    decSum,
    decU8,
    type Encoder,
    encSum,
    encU8,
    mapDecoder,
} from "./serial.ts";
import type { Bifunctor } from "./type-class/bifunctor.ts";
import type { PartialEq, PartialEqUnary } from "./type-class/partial-eq.ts";
import { type Eq, eqSymbol } from "./type-class/eq.ts";

const continueSymbol = Symbol("ControlFlowContinue");
/**
 * A variant telling that an operation should go on with a value of type `C`.
 */
export type Continue<C> = readonly [typeof continueSymbol, C];
export const newContinue = <C>(c: C): Continue<C> => [continueSymbol, c];

const breakSymbol = Symbol("ControlFlowBreak");
/**
 * A variant telling that an operation should exit early with a value of type `B`.
 */
export type Break<B> = readonly [typeof breakSymbol, B];
export const newBreak = <B>(b: B): Break<B> => [breakSymbol, b];

/**
 * An utility type `ControlFlow<B, C>`, which tells an operation whether it should exit early or go on. It's more clear than `boolean` or `Result` to show your code flow control explicity.
 */
export type ControlFlow<B, C = never[]> = Continue<C> | Break<B>;

export const partialEq = <B, C>(
    equalityB: PartialEq<B>,
    equalityC: PartialEq<C>,
): PartialEq<ControlFlow<B, C>> => ({
    eq: (l, r) =>
        isBreak(l) && isBreak(r)
            ? equalityB.eq(l[1], r[1])
            : isContinue(l) && isContinue(r) && equalityC.eq(l[1], r[1]),
});
export const eq = <B, C>(
    equalityB: Eq<B>,
    equalityC: Eq<C>,
): Eq<ControlFlow<B, C>> => ({
    eq: (l, r) =>
        isBreak(l) && isBreak(r)
            ? equalityB.eq(l[1], r[1])
            : isContinue(l) && isContinue(r) && equalityC.eq(l[1], r[1]),
    [eqSymbol]: true,
});

export const partialEqUnary = <B>(
    equalityB: PartialEq<B>,
): PartialEqUnary<Apply2Only<ControlFlowHkt, B>> => ({
    liftEq:
        <L, R>(equality: (l: L, r: R) => boolean) =>
        (l: ControlFlow<B, L>, r: ControlFlow<B, R>): boolean =>
            isBreak(l) && isBreak(r)
                ? equalityB.eq(l[1], r[1])
                : isContinue(l) && isContinue(r) && equality(l[1], r[1]),
});

export const isContinue = <B, C>(cf: ControlFlow<B, C>): cf is Continue<C> =>
    cf[0] === continueSymbol;
export const isBreak = <B, C>(cf: ControlFlow<B, C>): cf is Break<B> =>
    cf[0] === breakSymbol;

export const continueValue = <B, C>(cf: ControlFlow<B, C>): Option<C> =>
    isContinue(cf) ? some(cf[1]) : none();
export const breakValue = <B, C>(cf: ControlFlow<B, C>): Option<B> =>
    isBreak(cf) ? some(cf[1]) : none();

export const mapContinue =
    <C1, C2>(mapper: (c: C1) => C2) =>
    <B>(cf: ControlFlow<B, C1>): ControlFlow<B, C2> =>
        isContinue(cf) ? newContinue(mapper(cf[1])) : cf;
export const mapBreak =
    <B1, B2>(mapper: (b: B1) => B2) =>
    <C>(cf: ControlFlow<B1, C>): ControlFlow<B2, C> =>
        isBreak(cf) ? newBreak(mapper(cf[1])) : cf;

export const biMap =
    <B1, B2>(breakMapper: (b: B1) => B2) =>
    <C1, C2>(continueMapper: (c: C1) => C2) =>
    (cf: ControlFlow<B1, C1>): ControlFlow<B2, C2> =>
        isBreak(cf)
            ? newBreak(breakMapper(cf[1]))
            : newContinue(continueMapper(cf[1]));

export const flatten = <B, C>(
    cfCf: ControlFlow<B, ControlFlow<B, C>>,
): ControlFlow<B, C> => isContinue(cfCf) ? cfCf[1] : cfCf;

export const apply =
    <B, C1, C2>(cfFn: ControlFlow<B, (c: C1) => C2>) =>
    (cf: ControlFlow<B, C1>): ControlFlow<B, C2> =>
        isContinue(cfFn)
            ? (isContinue(cf) ? newContinue(cfFn[1](cf[1])) : cf)
            : cfFn;

export const flatMap =
    <B, C1, C2>(fn: (c: C1) => ControlFlow<B, C2>) =>
    (cf: ControlFlow<B, C1>): ControlFlow<B, C2> =>
        isContinue(cf) ? fn(cf[1]) : cf;

export const foldR =
    <C, X>(folder: (next: C) => (acc: X) => X) =>
    (init: X) =>
    <B>(data: ControlFlow<B, C>): X =>
        isContinue(data) ? folder(data[1])(init) : init;

export const traverse = <F>(
    app: Applicative<F>,
) =>
<C, X>(
    visitor: (a: C) => Get1<F, X>,
) =>
<B>(data: ControlFlow<B, C>): Get1<F, ControlFlow<B, X>> =>
    isContinue(data)
        ? app.map(newContinue<X>)(visitor(data[1]))
        : app.pure(data);

export interface ControlFlowHkt extends Hkt2 {
    readonly type: ControlFlow<this["arg2"], this["arg1"]>;
}

export const functor = <B>(): Functor<Apply2Only<ControlFlowHkt, B>> => ({
    map: mapContinue,
});

export const monad = <B>(): Monad<Apply2Only<ControlFlowHkt, B>> => ({
    pure: newContinue,
    map: mapContinue,
    apply,
    flatMap,
});

export const traversable = <B>(): Traversable<
    Apply2Only<ControlFlowHkt, B>
> => ({
    map: mapContinue,
    foldR,
    traverse,
});

export const traversableMonad = <B>(): TraversableMonad<
    Apply2Only<ControlFlowHkt, B>
> => ({
    ...monad(),
    ...traversable(),
});

export const bifunctor: Bifunctor<ControlFlowHkt> = { biMap };

export const enc =
    <B>(encB: Encoder<B>) =>
    <C>(encC: Encoder<C>): Encoder<ControlFlow<B, C>> =>
        encSum({
            [breakSymbol]: ([, b]: Break<B>) => encB(b),
            [continueSymbol]: ([, c]: Continue<C>) => encC(c),
        })(([key]) => key)((key) => encU8(key === breakSymbol ? 0 : 1));
export const dec =
    <B>(decB: Decoder<B>) =>
    <C>(decC: Decoder<C>): Decoder<ControlFlow<B, C>> =>
        decSum(decU8())<ControlFlow<B, C>>([
            mapDecoder(newBreak)(decB),
            mapDecoder(newContinue)(decC),
        ]);

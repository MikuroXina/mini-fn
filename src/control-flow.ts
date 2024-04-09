/**
 * This module provides an utility type `ControlFlow<B, C>`, which tells an operation whether it should exit early or go on.
 *
 * @packageDocumentation
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
    type Serial,
    type Serialize,
    serializeMonad,
    type Serializer,
} from "./serialize.ts";
import { doT } from "./cat.ts";
import {
    type Deserialize,
    type DeserializerError,
    newVisitor,
    type VariantsAccess,
    variantsDeserialize,
    type Visitor,
    visitorMonad,
    type VisitorState,
    type VoidVisitorHkt,
} from "./deserialize.ts";
import { runVoidVisitor } from "./deserialize.ts";

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
export type ControlFlow<B, C = []> = Continue<C> | Break<B>;

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

const VARIANTS = ["Continue", "Break"] as const;

export const serialize = <B>(
    serializeB: Serialize<B>,
) =>
<C>(serializeC: Serialize<C>): Serialize<ControlFlow<B, C>> =>
(v) =>
<S>(ser: Serializer<S>): Serial<S> =>
    doT(serializeMonad<S>()).addM(
        "serVariant",
        isContinue(v)
            ? ser.serializeTupleVariant("ControlFlow", 0, VARIANTS[0], 1)
            : ser.serializeTupleVariant("ControlFlow", 1, VARIANTS[1], 1),
    ).addMWith("_", ({ serVariant }) =>
        isContinue(v)
            ? serVariant
                .serializeElement(serializeC)(v[1])
            : serVariant
                .serializeElement(serializeB)(v[1]))
        .finishM(({ serVariant }) => serVariant.end()) as Serial<S>;

export const visitor = <B>(deserializeB: Deserialize<B>) =>
<C>(
    deserializeC: Deserialize<C>,
): Visitor<VoidVisitorHkt<ControlFlow<B, C>>> =>
    newVisitor("ControlFlow")<VoidVisitorHkt<ControlFlow<B, C>>>({
        visitVariants: <D>(variants: VariantsAccess<D>) => {
            const m = visitorMonad<VoidVisitorHkt<ControlFlow<B, C>>>();
            return doT(m)
                .addM(
                    "variant",
                    variants.variant(variantsDeserialize(VARIANTS)),
                )
                .finishM((
                    { variant: [key, access] },
                ): VisitorState<
                    DeserializerError<D>,
                    VoidVisitorHkt<ControlFlow<B, C>>
                > => key === "Continue"
                    ? m.map(newContinue<C>)(
                        access.visitCustom(deserializeC),
                    )
                    : m.map(newBreak<B>)(access.visitCustom(deserializeB))
                );
        },
    });

export const deserialize =
    <B>(deserializeB: Deserialize<B>) =>
    <C>(deserializeC: Deserialize<C>): Deserialize<ControlFlow<B, C>> =>
    (de) =>
        runVoidVisitor(
            de.deserializeVariants("ControlFlow")(VARIANTS)(
                visitor(deserializeB)(deserializeC),
            ),
        );

/**
 * This package provides serialization utilities such as `deserializeMonad`. They depend on the serial model in `Serialize` module.
 *
 * A `Deserialize<T>` instance visits `Deserializer`'s methods to deserialize into an object `T` with Visitor pattern. You can implement it as a custom instance.
 *
 * @packageDocumentation
 */

import type { Apply2Only } from "./hkt.ts";
import type { Option } from "./option.ts";
import { monadT, type ReaderT } from "./reader.ts";
import { err, monad, type Result, type ResultHkt } from "./result.ts";

export interface VisitorHkt {
    readonly valueType: unknown;
}
export type VisitorValue<S> = S extends VisitorHkt ? S["valueType"] : never;
export type VisitorResult<S> = Result<DeserializeError, VisitorValue<S>>;
export type VisitorReader<S, T> = ReaderT<
    Visitor<S>,
    Apply2Only<ResultHkt, DeserializeError>,
    T
>;
export type VisitorRet<S> = VisitorReader<S, VisitorValue<S>>;

/**
 * A visitor that telling the values occurring on deserialization to a `Deserialize` instance.
 */
export interface Visitor<S> {
    /**
     * A message about what you are expecting.
     */
    readonly expecting: string;

    readonly visitString: (v: string) => VisitorRet<S>;
    readonly visitNumber: (v: number) => VisitorRet<S>;
    readonly visitBoolean: (v: boolean) => VisitorRet<S>;
    readonly visitNull: () => VisitorRet<S>;
    readonly visitUndefined: () => VisitorRet<S>;
    readonly visitBigInt: (v: bigint) => VisitorRet<S>;
    readonly visitCustom: (deserializer: Deserializer) => VisitorRet<S>;
    readonly visitArray: (array: ArrayAccess<S>) => VisitorRet<S>;
    readonly visitRecord: (record: RecordAccess<S>) => VisitorRet<S>;
    readonly visitVariants: (variants: VariantsAccess<S>) => VisitorRet<S>;
}

export interface ArrayAccess<S> {
    readonly nextElement: <T>(
        de: Deserialize<T>,
    ) => VisitorReader<S, Option<T>>;
    readonly sizeHint: Option<number>;
}

export interface RecordAccess<S> {
    readonly nextKey: <K>(de: Deserialize<K>) => VisitorReader<S, Option<K>>;
    readonly nextValue: <V>(de: Deserialize<V>) => VisitorReader<S, V>;
    readonly sizeHint: Option<number>;
}

export interface VariantVisitor<S> {
    readonly visitUnit: () => VisitorReader<S, []>;
    readonly visitTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => VisitorRet<V>;
    readonly visitRecord: (
        fields: readonly string[],
    ) => <V>(visitor: Visitor<V>) => VisitorRet<V>;
    readonly visitCustom: <T>(de: Deserialize<T>) => VisitorReader<S, T>;
}

export interface VariantsAccess<S> {
    readonly variant: <V>(
        de: Deserialize<V>,
    ) => VisitorReader<S, [V, VariantVisitor<S>]>;
}

export const visitorMonad = <S>() =>
    monadT<Visitor<S>, Apply2Only<ResultHkt, DeserializeError>>(
        monad<DeserializeError>(),
    );

/**
 * Creates a new visitor from a table of methods. Unprovided methods will be implemented as a function that just returns an unexpected error.
 *
 * @param expecting - Description of the type you are expecting.
 * @returns The new visitor.
 */
export const newVisitor = (expecting: string) =>
<S>(
    methods: Partial<Omit<Visitor<S>, "expecting">>,
): Visitor<S> => ({
    expecting,
    visitString: () => () => err(() => "unexpected string"),
    visitNumber: () => () => err(() => "unexpected number"),
    visitBoolean: () => () => err(() => "unexpected boolean"),
    visitNull: () => () => err(() => "unexpected null"),
    visitUndefined: () => () => err(() => "unexpected undefined"),
    visitBigInt: () => () => err(() => "unexpected bigint"),
    visitCustom: () => () => err(() => "unexpected custom"),
    visitArray: () => () => err(() => "unexpected array"),
    visitRecord: () => () => err(() => "unexpected record"),
    visitVariants: () => () => err(() => "unexpected variants"),
    ...methods,
});

export type DeserializeError = <T extends object>(msg: T) => string;

export interface Deserializer {
    readonly deserializeUnknown: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeString: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeNumber: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeBoolean: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeNull: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeUndefined: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeBigInt: <V>(v: Visitor<V>) => VisitorResult<V>;
    readonly deserializeArray: <V>(visitor: Visitor<V>) => VisitorResult<V>;
    readonly deserializeTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => VisitorResult<V>;
    readonly deserializeRecord: <V>(visitor: Visitor<V>) => VisitorResult<V>;
    readonly deserializeVariants: (
        name: string,
    ) => (
        variants: readonly string[],
    ) => <V>(visitor: Visitor<V>) => VisitorResult<V>;
}

/**
 * A function that deserializes a data structure into `T`.
 */
export type Deserialize<T> = ReaderT<
    Deserializer,
    Apply2Only<ResultHkt, DeserializeError>,
    T
>;

export const deserialize =
    (deserializer: Deserializer) =>
    <T>(de: Deserialize<T>): Result<DeserializeError, T> => de(deserializer);

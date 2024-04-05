/**
 * This package provides serialization utilities such as `deserializeMonad`. They depend on the serial model in `Serialize` module.
 *
 * A `Deserialize<T>` instance visits `Deserializer`'s methods to deserialize into an object `T` with Visitor pattern. You can implement it as a custom instance.
 *
 * @packageDocumentation
 */

import type { Option } from "./option.ts";
import { err } from "./result.ts";
import type { Result } from "./result.ts";

export interface VisitorHkt {
    readonly valueType: unknown;
}

export type VisitorValue<V> = V extends VisitorHkt ? V["valueType"] : never;

export interface ArrayVisitor {
    readonly nextElement: <V>(
        de: Deserialize<V>,
    ) => DeserialReading<Option<V>>;
    readonly sizeHint: Option<number>;
}

export interface RecordVisitor {
    readonly nextKey: <K>(de: Deserialize<K>) => DeserialReading<Option<K>>;
    readonly nextValue: <V>(de: Deserialize<V>) => DeserialReading<V>;
    readonly sizeHint: Option<number>;
}

export interface VariantVisitor {
    readonly onUnit: () => DeserialReading<[]>;
    readonly onTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => Deserial<V>;
    readonly onRecord: (
        fields: readonly string[],
    ) => <V>(visitor: Visitor<V>) => Deserial<V>;
    readonly onCustom: <T>(de: Deserialize<T>) => DeserialReading<T>;
}

export interface VariantsVisitor {
    readonly variant: <V>(
        de: Deserialize<V>,
    ) => DeserialReading<[V, VariantVisitor]>;
}

/**
 * A visitor that telling the values occurring on deserialization to a `Deserialize` instance.
 */
export interface Visitor<V> {
    /**
     * A message about what you are expecting.
     */
    readonly expecting: string;

    readonly onString: (v: string) => Deserial<V>;
    readonly onNumber: (v: number) => Deserial<V>;
    readonly onBoolean: (v: boolean) => Deserial<V>;
    readonly onNull: () => Deserial<V>;
    readonly onUndefined: () => Deserial<V>;
    readonly onBigInt: (v: bigint) => Deserial<V>;
    readonly onArray: (vi: ArrayVisitor) => Deserial<V>;
    readonly onRecord: (vi: RecordVisitor) => Deserial<V>;
    readonly onVariants: (vi: VariantsVisitor) => Deserial<V>;
}

/**
 * Creates a new visitor from a table of methods. Unprovided methods will be implemented as a function that just returns an unexpected error.
 *
 * @param expecting - Description of the type you are expecting.
 * @returns The new visitor.
 */
export const newVisitor = (expecting: string) =>
<V>(
    methods: Partial<Visitor<V>>,
): Visitor<V> => ({
    expecting,
    onString: () => err(() => "unexpected string"),
    onNumber: () => err(() => "unexpected number"),
    onBoolean: () => err(() => "unexpected boolean"),
    onNull: () => err(() => "unexpected null"),
    onUndefined: () => err(() => "unexpected undefined"),
    onBigInt: () => err(() => "unexpected bigint"),
    onArray: () => err(() => "unexpected array"),
    onRecord: () => err(() => "unexpected record"),
    onVariants: () => err(() => "unexpected variants"),
    ...methods,
});

export type DeserializeError = <T extends object>(msg: T) => string;
export type DeserialReading<T> = Result<DeserializeError, T>;
export type Deserial<V> = Result<DeserializeError, VisitorValue<V>>;

/**
 * Entries that hint what deserialization is about to start.
 */
export interface Deserializer {
    readonly deserializeUnknown: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeString: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeNumber: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeBoolean: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeNull: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeUndefined: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeBigInt: <V>(v: Visitor<V>) => Deserial<V>;
    readonly deserializeArray: <V>(visitor: Visitor<V>) => Deserial<V>;
    readonly deserializeTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => Deserial<V>;
    readonly deserializeRecord: <V>(visitor: Visitor<V>) => Deserial<V>;
    readonly deserializeVariants: (
        name: string,
    ) => (
        variants: readonly string[],
    ) => <V>(visitor: Visitor<V>) => Deserial<V>;
}

/**
 * A function that deserializes a data structure into `T`.
 */
export type Deserialize<T> = (deserializer: Deserializer) => DeserialReading<T>;

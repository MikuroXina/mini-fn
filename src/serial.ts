/**
 * This package provides serialization utilities.
 *
 * # Serial Model
 *
 * `Serializer` and `Deserializer` work on its own serial model. It has these primitives:
 *
 * - String
 * - Number
 * - Boolean
 * - Null
 * - Undefined
 * - Bigint
 * - Array
 * - Record
 * - Variant
 * - Custom
 *
 * @packageDocumentation
 */

import { traversable } from "./array.ts";
import { applicative, err, map, ok, type Result } from "./result.ts";
import { sequenceA } from "./type-class/traversable.ts";

const stringNominal = Symbol("SerialString");
export type SerialString = [typeof stringNominal, value: string];

const numberNominal = Symbol("SerialNumber");
export type SerialNumber = [typeof numberNominal, value: number];

const booleanNominal = Symbol("SerialBoolean");
export type SerialBoolean = [typeof booleanNominal, value: boolean];

const nullNominal = Symbol("SerialNull");
export type SerialNull = [typeof nullNominal];

const undefinedNominal = Symbol("SerialUndefined");
export type SerialUndefined = [typeof undefinedNominal];

const bigIntNominal = Symbol("SerialBigInt");
export type SerialBigInt = [typeof bigIntNominal, value: bigint];

const tupleNominal = Symbol("SerialTuple");
export type SerialTuple = [typeof tupleNominal, value: readonly Serial[]];

const arrayNominal = Symbol("SerialArray");
export type SerialArray = [typeof arrayNominal, value: readonly Serial[]];

const recordNominal = Symbol("SerialRecord");
export type SerialRecord = [
    typeof recordNominal,
    value: Readonly<Record<string, Serial>>,
];

const variantNominal = Symbol("SerialVariant");
export type SerialVariant = [
    typeof variantNominal,
    variantIndex: number,
    value: Serial,
];

const customNominal = Symbol("SerialCustom");
export type SerialCustom = [
    typeof customNominal,
    typeName: string,
    value: Serial,
];

/**
 * A token of the Serial Model.
 */
export type Serial =
    | SerialString
    | SerialNumber
    | SerialBoolean
    | SerialNull
    | SerialUndefined
    | SerialBigInt
    | SerialTuple
    | SerialArray
    | SerialRecord
    | SerialVariant
    | SerialCustom;

/**
 * A data structure that can be serialized `T` into any data format by a `SerialEncoder`.
 */
export type Serializer<T> = (value: T) => Serial;

/**
 * A `Serializer` for a `string`.
 */
export const serializeString: Serializer<string> = (
    value,
) => [stringNominal, value];
/**
 * A `Serializer` for a `number`.
 */
export const serializeNumber: Serializer<number> = (
    value,
) => [numberNominal, value];
/**
 * A `Serializer` for a `boolean`.
 */
export const serializeBoolean: Serializer<boolean> = (
    value,
) => [booleanNominal, value];
/**
 * A `Serializer` for a `null`, but no value required.
 */
export const serializeNull: Serializer<null> = () => [nullNominal];
/**
 * A `Serializer` for a `undefined`, but no value required.
 */
export const serializeUndefined: Serializer<undefined> =
    () => [undefinedNominal];
/**
 * A `Serializer` for a `bigint`.
 */
export const serializeBigInt: Serializer<bigint> = (
    value,
) => [bigIntNominal, value];
/**
 * A `Serializer` for a heterogenous tuple.
 */
export const serializeTuple = <VS extends unknown[]>(
    serializers: { readonly [K in keyof VS]: Serializer<VS[K]> },
): Serializer<VS> =>
(values) => [tupleNominal, values.map((value, i) => serializers[i](value))];
/**
 * A `Serializer` for a homogenous array.
 */
export const serializeArray =
    <T>(serializer: Serializer<T>): Serializer<T[]> => (values) => [
        arrayNominal,
        values.map(serializer),
    ];
/**
 * A `Serializer` for a record, dictionary object.
 */
export const serializeRecord = <O extends Record<string, unknown>>(
    serializers: { readonly [K in keyof O]: Serializer<O[K]> },
): Serializer<O> =>
(values) => [
    recordNominal,
    Object.fromEntries(
        (Object.entries(values) as [keyof O, O[keyof O]][]).map((
            [key, value],
        ) => [key, serializers[key](value)]),
    ),
];
/**
 * Serializes a variant of your enum.
 *
 * **Note**: Changing `variantIndex` value in your serializer may occur a breaking change.
 *
 * @param variantIndex - The index in the variant of your enum.
 * @param serial - The actual containing value of the variant.
 * @returns The new serialized variant.
 */
export const serializeVariant =
    (variantIndex: number) => (serial: Serial): SerialVariant => [
        variantNominal,
        variantIndex,
        serial,
    ];

/**
 * Serializes a custom type.
 *
 * @param typeName - The custom type name of your data.
 * @param serial - The containing value of your custom data.
 * @returns The new serialized custom data.
 */
export const serializeCustom =
    (typeName: string) => (serial: Serial): SerialCustom => [
        customNominal,
        typeName,
        serial,
    ];

/**
 * A base constraint for reporting deserialization error.
 */
export type DeserializerErrorBase = <T extends object>(upstream: T) => string;
/**
 * A data structure that can be deserialized `T` from any data format by a `SerialDecoder`.
 */
export type Deserializer<T> = <E extends DeserializerErrorBase>(
    serial: Serial,
) => Result<E, T>;

const serialTypeName: Record<Serial[0], string> = {
    [stringNominal]: "string",
    [numberNominal]: "number",
    [booleanNominal]: "boolean",
    [nullNominal]: "null",
    [undefinedNominal]: "undefined",
    [bigIntNominal]: "bigint",
    [tupleNominal]: "tuple",
    [arrayNominal]: "array",
    [recordNominal]: "record",
    [variantNominal]: "variant",
    [customNominal]: "custom",
};

/**
 * Creates a new unexpected error of `DeserializerErrorBase`.
 *
 * @param serial - The serial that was not expected.
 * @returns The new error object.
 */
export const unexpected = <E extends DeserializerErrorBase>(
    serial: Serial,
): E => ((msg) => `unexpected ${serialTypeName[serial[0]]}: ${msg}`) as E;

/**
 * A `Deserializer` for a `string`.
 */
export const deserializeString: Deserializer<string> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== stringNominal ? err(unexpected<E>(serial)) : ok(serial[1]);

/**
 * A `Deserializer` for a `number`.
 */
export const deserializeNumber: Deserializer<number> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== numberNominal ? err(unexpected<E>(serial)) : ok(serial[1]);

/**
 * A `Deserializer` for a `boolean`.
 */
export const deserializeBoolean: Deserializer<boolean> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== booleanNominal ? err(unexpected<E>(serial)) : ok(serial[1]);

/**
 * A `Deserializer` for a `null`.
 */
export const deserializeNull: Deserializer<null> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== nullNominal ? err(unexpected<E>(serial)) : ok(null);

/**
 * A `Deserializer` for a `undefined`.
 */
export const deserializeUndefined: Deserializer<undefined> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== undefinedNominal ? err(unexpected<E>(serial)) : ok(undefined);

/**
 * A `Deserializer` for a `bigint`.
 */
export const deserializeBigInt: Deserializer<bigint> = <
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== bigIntNominal ? err(unexpected<E>(serial)) : ok(serial[1]);

/**
 * A `Deserializer` for a heterogenous array.
 */
export const deserializeTuple = <VS extends unknown[]>(
    deserializers: { readonly [K in keyof VS]: Deserializer<VS[K]> },
): Deserializer<VS> =>
<
    E extends DeserializerErrorBase,
>(serial: Serial) =>
    serial[0] !== tupleNominal
        ? err(unexpected<E>(serial))
        : sequenceA(traversable, applicative<E>())(
            serial[1].map((s, i) => deserializers[i](s)) as Result<
                E,
                unknown
            >[],
        ) as Result<E, VS>;

/**
 * A `Deserializer` for a homogenous array.
 */
export const deserializeArray =
    <T>(deserializer: Deserializer<T>): Deserializer<T[]> =>
    <E extends DeserializerErrorBase>(serial: Serial) =>
        serial[0] !== arrayNominal
            ? err(unexpected<E>(serial))
            : sequenceA(traversable, applicative<E>())(
                serial[1].map<Result<E, T>>(deserializer),
            ) as Result<E, T[]>;

/**
 * A `Deserializer` for a record, dictionary array.
 */
export const deserializeRecord = <O extends Record<string, unknown>>(
    deserializers: { readonly [K in keyof O]: Deserializer<O[K]> },
): Deserializer<O> =>
<E extends DeserializerErrorBase>(serial: Serial) =>
    serial[0] !== recordNominal
        ? err(unexpected<E>(serial))
        : map(Object.fromEntries)(
            sequenceA(traversable, applicative<E>())(
                Object.entries(serial[1]).map(([key, serial]) =>
                    map((value) => [key, value])(deserializers[key](serial))
                ),
            ) as Result<E, [keyof O, O[keyof O]][]>,
        ) as Result<E, O>;

/**
 * A `Deserializer` for a variant of your enum.
 */
export const deserializeVariant =
    <T>(deserializers: readonly Deserializer<T>[]): Deserializer<T> =>
    <E extends DeserializerErrorBase>(serial: Serial) =>
        serial[0] !== variantNominal
            ? err(unexpected<E>(serial))
            : !(serial[1] in deserializers)
            ? err(
                ((msg) =>
                    `invalid index [${
                        serial[1]
                    }] for the variant: ${msg}`) as E,
            )
            : deserializers[serial[1]]<E>(serial);

/**
 * A `Deserializer` for your custom data.
 */
export const deserializeCustom =
    (typeName: string) =>
    <T>(deserializer: Deserializer<T>): Deserializer<T> =>
    <E extends DeserializerErrorBase>(serial: Serial) =>
        serial[0] !== customNominal
            ? err(unexpected<E>(serial))
            : serial[1] !== typeName
            ? err(
                ((msg) =>
                    `unexpected custom type name [${serial[1]}]: ${msg}`) as E,
            )
            : deserializer<E>(serial);

/**
 * A data format that can serialize/deserialize any data structure.
 *
 * A `DataFormat` instance must satisfy the law: for all `format: F`, `decode(encode(format)) == ok(format)`.
 */
export interface DataFormat<E extends DeserializerErrorBase, F> {
    encode: (format: F) => Serial;
    decode: (serial: Serial) => Result<E, F>;
}

/**
 * Serializes data into a data format with `DataFormat<E, F>`.
 *
 * @param df - A `DataFormat` instance for a data format `F`.
 * @param serializer - A `Serializer` instance to serialize data `T`.
 * @param data - Data to be serialized.
 * @returns The serialized format, or error `E` on failure.
 */
export const serialize =
    <E extends DeserializerErrorBase, F>(df: DataFormat<E, F>) =>
    <T>(serializer: Serializer<T>) =>
    (data: T): Result<E, F> => df.decode(serializer(data));

/**
 * Deserializes a data format into data with `DataFormat<E, F>`.
 *
 * @param df - A `DataFormat` instance for a data format `F`.
 * @param deserializer - A `Deserializer` instance to deserialize data `T`.
 * @param format - Data to be parsed.
 * @returns The deserialized data, or error `E` on failure.
 */
export const deserialize =
    <E extends DeserializerErrorBase, F>(df: DataFormat<E, F>) =>
    <T>(deserializer: Deserializer<T>) =>
    (format: F): Result<E, T> => deserializer(df.encode(format));

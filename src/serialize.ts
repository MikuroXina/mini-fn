/**
 * This package provides serialization utilities such as `serializeMonad`,
`collectArray`, `collectRecord` and so on.
 *
 * # Serial Model
 *
 * `Serializer` works under its own serial model. It has these primitives:
 *
 * - `string`
 * - `number`
 * - `boolean`
 * - `null`
 * - `undefined`
 * - `bigint`
 * - `tuple`
 * - `array`
 * - `record`
 * - `variant`
 *
 * A `Serialize<T>` instance invokes `Serializer`'s methods to serialize an object `T`. You can implement it as a custom instance.
 *
 * Note: You should consider that changing the variant index of your data will be a breaking change.
 *
 * @packageDocumentation
 */

import { doT } from "./cat.ts";
import type { Apply2Only, Hkt0 } from "./hkt.ts";
import { monad, type Result, ResultHkt } from "./result.ts";
import { monadT } from "./state.ts";
import type { StateT } from "./state.ts";

export interface SerializerHkt extends Hkt0 {
    readonly okType: unknown;
    readonly errType: unknown;
}

export type SerializerSelf<S> = S extends SerializerHkt ? S["type"] : never;
export type SerializerOk<S> = S extends SerializerHkt ? S["okType"] : never;
export type SerializerErr<S> = S extends SerializerHkt ? S["errType"] : never;
export type SerializerResult<S> = S extends SerializerHkt
    ? Result<S["errType"], S["okType"]>
    : never;

export type SerialWriting<S, T> = S extends SerializerHkt ? StateT<
        SerializerSelf<S>,
        Apply2Only<ResultHkt, SerializerErr<S>>,
        T
    >
    : never;

export type Serial<S> = SerialWriting<S, SerializerOk<S>>;

export interface ArraySerializer<S> {
    readonly serializeElement: <T>(
        serialize: Serialize<T>,
    ) => (value: T) => SerialWriting<S, []>;
    readonly end: () => Serial<S>;
}

export interface TupleSerializer<S> {
    readonly serializeElement: <T>(
        serialize: Serialize<T>,
    ) => (value: T) => SerialWriting<S, []>;
    readonly end: () => Serial<S>;
}

export interface RecordSerializer<S> {
    readonly serializeKey: <T>(serialize: Serialize<T>) => (
        value: T,
    ) => SerialWriting<S, []>;
    readonly serializeValue: <T>(serialize: Serialize<T>) => (
        value: T,
    ) => SerialWriting<S, []>;
    readonly end: () => Serial<S>;
}

export interface Serializer<S> {
    readonly serializeString: (v: string) => Serial<S>;
    readonly serializeNumber: (v: number) => Serial<S>;
    readonly serializeBoolean: (v: boolean) => Serial<S>;
    readonly serializeNull: () => Serial<S>;
    readonly serializeUndefined: () => Serial<S>;
    readonly serializeBigInt: (v: bigint) => Serial<S>;
    readonly serializeArray: (
        len: number,
    ) => SerialWriting<S, ArraySerializer<S>>;
    readonly serializeTuple: (
        len: number,
    ) => SerialWriting<S, TupleSerializer<S>>;
    readonly serializeRecord: (
        len: number,
    ) => SerialWriting<S, RecordSerializer<S>>;
    readonly serializeUnitVariant: (
        name: string,
        variantIndex: number,
        variant: string,
    ) => Serial<S>;
    readonly serializeTupleVariant: (
        name: string,
        variantIndex: number,
        variant: string,
        len: number,
    ) => SerialWriting<S, TupleSerializer<S>>;
    readonly serializeRecordVariant: (
        name: string,
        variantIndex: number,
        variant: string,
        len: number,
    ) => SerialWriting<S, RecordSerializer<S>>;
}

export type Serialize<T> = <S>(
    t: T,
) => (serializer: Serializer<S>) => Serial<S>;

export const serializeMonad = <S>() =>
    monadT<SerializerSelf<S>, Apply2Only<ResultHkt, SerializerErr<S>>>(
        monad<SerializerErr<S>>(),
    );

export const collectArray =
    <T>(serializeT: Serialize<T>): Serialize<readonly T[]> =>
    <S>(arr: readonly T[]) =>
    (ser: Serializer<S>): Serial<S> => {
        const cat = doT(serializeMonad<S>()).addM(
            "arraySer",
            ser.serializeArray(arr.length),
        );
        return arr.reduce((prev, item) =>
            prev.addMWith(
                "_",
                ({ arraySer }) => arraySer.serializeElement(serializeT)(item),
            ), cat)
            .finishM(({ arraySer }) => arraySer.end()) as Serial<S>;
    };

export const collectRecord =
    <K extends PropertyKey>(serializeK: Serialize<K>) =>
    <V>(serializeV: Serialize<V>): Serialize<Record<K, V>> =>
    <S>(rec: Record<K, V>) =>
    (ser: Serializer<S>): Serial<S> => {
        const keys = Reflect.ownKeys(rec) as K[];
        const cat = doT(serializeMonad<S>()).addM(
            "recSer",
            ser.serializeRecord(
                keys.length,
            ),
        );
        return keys.reduce(
            (prev, key) =>
                prev.addMWith(
                    "_",
                    ({ recSer }) => recSer.serializeKey(serializeK)(key),
                )
                    .addMWith(
                        "_",
                        ({ recSer }) =>
                            recSer.serializeKey(serializeV)(rec[key]),
                    ),
            cat,
        )
            .finishM(({ recSer }) => recSer.end()) as Serial<S>;
    };

export const collectString =
    <T extends object>(v: T) => <S>(ser: Serializer<S>) =>
        ser.serializeString(v.toString());

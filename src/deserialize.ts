/**
 * This package provides serialization utilities such as `deserializeMonad`. They depend on the serial model in `Serialize` module.
 *
 * A `Deserialize<T>` instance visits `Deserializer`'s methods to deserialize into an object `T` with Visitor pattern. You can implement it as a custom instance.
 *
 * @packageDocumentation
 */

import type { Apply2Only, Apply3Only, Hkt0 } from "./hkt.ts";
import type { Option } from "./option.ts";
import { monadT, type StateT, type StateTHkt } from "./state.ts";
import { err, monad, ok, type Result, type ResultHkt } from "./result.ts";
import type { Monad } from "./type-class/monad.ts";

export type DeserializeErrorBase = <T extends object>(msg: T) => string;

export interface DeserializerHkt extends Hkt0 {
    readonly errorType: DeserializeErrorBase;
}

export type DeserializerSelf<D> = D extends DeserializerHkt ? D["type"] : never;
export type DeserializerError<D> = D extends DeserializerHkt ? D["errorType"]
    : never;
export type DeserializerResult<D, T> = Result<DeserializerError<D>, T>;
export type DeserializerState<D, T> = StateT<
    DeserializerSelf<D>,
    Apply2Only<ResultHkt, DeserializerError<D>>,
    T
>;

export interface VisitorHkt extends Hkt0 {
    readonly valueType: unknown;
}

export interface VoidVisitorHkt<T> extends VisitorHkt {
    valueType: T;
    type: [];
}

export type VisitorSelf<V> = V extends VisitorHkt ? V["type"] : never;
export type VisitorValue<V> = V extends VisitorHkt ? V["valueType"] : never;
export type VisitorResult<E, V> = Result<E, VisitorValue<V>>;
export type VisitorState<E, V> = StateT<
    VisitorSelf<V>,
    Apply2Only<ResultHkt, E>,
    VisitorValue<V>
>;
export type VisitorStateRet<V> = [VisitorValue<V>, VisitorSelf<V>];
export type VisitorStateHkt<V> = Apply2Only<
    Apply3Only<StateTHkt, VisitorSelf<V>>,
    Apply2Only<ResultHkt, DeserializeErrorBase>
>;

/**
 * A visitor that telling the values occurring on deserialization to a `Deserialize` instance.
 */
export interface Visitor<V> {
    /**
     * A message about what you are expecting.
     */
    readonly expecting: string;

    readonly visitString: <E extends DeserializeErrorBase>(
        v: string,
    ) => VisitorState<E, V>;
    readonly visitNumber: <E extends DeserializeErrorBase>(
        v: number,
    ) => VisitorState<E, V>;
    readonly visitBoolean: <E extends DeserializeErrorBase>(
        v: boolean,
    ) => VisitorState<E, V>;
    readonly visitNull: <E extends DeserializeErrorBase>() => VisitorState<
        E,
        V
    >;
    readonly visitUndefined: <E extends DeserializeErrorBase>() => VisitorState<
        E,
        V
    >;
    readonly visitBigInt: <E extends DeserializeErrorBase>(
        v: bigint,
    ) => VisitorState<E, V>;
    readonly visitCustom: <D>(
        deserializer: Deserializer<D>,
    ) => VisitorState<DeserializerError<D>, V>;
    readonly visitArray: <D>(
        array: ArrayAccess<D>,
    ) => VisitorState<DeserializerError<D>, V>;
    readonly visitRecord: <D>(
        record: RecordAccess<D>,
    ) => VisitorState<DeserializerError<D>, V>;
    readonly visitVariants: <D>(
        variants: VariantsAccess<D>,
    ) => VisitorState<DeserializerError<D>, V>;
}

export interface ArrayAccess<D> {
    readonly nextElement: <T>(
        de: Deserialize<T>,
    ) => VisitorState<DeserializerError<D>, VoidVisitorHkt<Option<T>>>;
    readonly sizeHint: Option<number>;
}

export interface RecordAccess<D> {
    readonly nextKey: <K>(
        de: Deserialize<K>,
    ) => VisitorState<DeserializerError<D>, VoidVisitorHkt<Option<K>>>;
    readonly nextValue: <V>(
        de: Deserialize<V>,
    ) => VisitorState<DeserializerError<D>, VoidVisitorHkt<V>>;
    readonly sizeHint: Option<number>;
}

export interface VariantVisitor<D> {
    readonly visitUnit: () => VisitorState<
        DeserializerError<D>,
        VoidVisitorHkt<[]>
    >;
    readonly visitTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => VisitorState<DeserializerError<D>, V>;
    readonly visitRecord: (
        fields: readonly string[],
    ) => <V>(visitor: Visitor<V>) => VisitorState<DeserializerError<D>, V>;
    readonly visitCustom: <T>(
        de: Deserialize<T>,
    ) => VisitorState<DeserializerError<D>, VoidVisitorHkt<T>>;
}

export interface VariantsAccess<D> {
    readonly variant: <V>(
        de: Deserialize<V>,
    ) => StateT<
        [],
        Apply2Only<ResultHkt, DeserializerError<D>>,
        [V, VariantVisitor<D>]
    >;
}

export const pure =
    <E, V>(item: VisitorValue<V>): VisitorState<E, V> => (self) =>
        ok([item, self] as [VisitorValue<V>, VisitorSelf<V>]);

export const visitorMonad = <V>(): Monad<VisitorStateHkt<V>> =>
    monadT<VisitorSelf<V>, Apply2Only<ResultHkt, DeserializeErrorBase>>(
        monad<DeserializeErrorBase>(),
    );

const unexpectedError = <E extends DeserializeErrorBase>(name: string): E =>
    (() => "unexpected " + name) as unknown as E;

/**
 * Creates a new visitor from a table of methods. Unprovided methods will be implemented as a function that just returns an unexpected error.
 *
 * @param expecting - Description of the type you are expecting.
 * @param methods - Methods of a new `Visitor`.
 * @returns The new visitor.
 */
export const newVisitor = (expecting: string) =>
<V>(
    methods: Partial<Omit<Visitor<V>, "expecting">>,
): Visitor<V> => ({
    expecting,
    visitString: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("string")),
    visitNumber: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("number")),
    visitBoolean:
        <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
            err(unexpectedError<E>("boolean")),
    visitNull: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("null")),
    visitUndefined:
        <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
            err(unexpectedError<E>("undefined")),
    visitBigInt: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("bigint")),
    visitCustom: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("custom")),
    visitArray: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("array")),
    visitRecord: <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
        err(unexpectedError<E>("record")),
    visitVariants:
        <E extends DeserializeErrorBase>(): VisitorState<E, V> => () =>
            err(unexpectedError<E>("variants")),
    ...methods,
});

export interface Deserializer<D> {
    readonly deserializeUnknown: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeString: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeNumber: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeBoolean: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeNull: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeUndefined: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeBigInt: <V>(
        v: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeArray: <V>(
        visitor: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeTuple: (
        len: number,
    ) => <V>(visitor: Visitor<V>) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeRecord: <V>(
        visitor: Visitor<V>,
    ) => VisitorResult<DeserializerError<D>, V>;
    readonly deserializeVariants: (
        name: string,
    ) => (
        variants: readonly string[],
    ) => <V>(visitor: Visitor<V>) => VisitorResult<DeserializerError<D>, V>;
}

/**
 * A function that deserializes a data structure into `T`.
 */
export type Deserialize<T> = <D>(
    deserializer: Deserializer<D>,
) => Result<DeserializerError<D>, T>;

export const deserialize =
    <D>(deserializer: Deserializer<D>) =>
    <T>(de: Deserialize<T>): Result<DeserializerError<D>, T> =>
        de(deserializer);

export interface VariantsVisitorHkt<VS extends readonly string[]>
    extends VisitorHkt {
    readonly type: [];
    readonly valueType: VS[number];
}

export const variantsDeserialize = <const VS extends readonly string[]>(
    variants: VS,
): Deserialize<VS[number]> =>
(de) => {
    const isVariants = (v: string): v is VS[number] =>
        (variants as readonly string[]).includes(v);
    return de.deserializeString<VariantsVisitorHkt<VS>>(
        newVisitor("variant key")<VariantsVisitorHkt<VS>>({
            visitString:
                <E extends DeserializeErrorBase>(v: string) => (state) =>
                    isVariants(v)
                        ? ok(
                            [v, state] as VisitorStateRet<
                                VariantsVisitorHkt<VS>
                            >,
                        )
                        : err(unexpectedError<E>(`variant: ${v}`)),
        }),
    );
};

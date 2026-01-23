import {
    dec as arrayDecoder,
    enc as arrayEncoder,
    foldR as foldRArray,
} from "./array.js";
import { doT } from "./cat.js";
import { newBreak, newContinue } from "./control-flow.js";
import * as Option from "./option.js";
import { dec as recordDecoder } from "./record.js";
import type { Decoder, Encoder } from "./serial.js";
import * as Serial from "./serial.js";
import type { PartialEq } from "./type-class/partial-eq.js";

/**
 * A combinator to model business data type.
 */
export interface Model<T> {
    readonly clone: (value: T) => T;
    readonly validate: (value: unknown) => value is T;
    readonly encoder: Encoder<T>;
    readonly decoder: Decoder<T>;
}

// Primitives

/**
 * A `Model` for `boolean`.
 */
export const bool: Model<boolean> = {
    clone: (value) => value,
    validate: (value) => typeof value === "boolean",
    encoder: (value) => Serial.encU8(value ? 1 : 0),
    decoder: Serial.mapDecoder((v: number) => v !== 0)(Serial.decU8()),
};

/**
 * A `Model` for `number`.
 */
export const num: Model<number> = {
    clone: (value) => value,
    validate: (value) => typeof value === "number",
    encoder: Serial.encF64Le,
    decoder: Serial.decF64Le(),
};

/**
 * A `Model` for `bigint`.
 */
export const int: Model<bigint> = {
    clone: (value) => value,
    validate: (value) => typeof value === "bigint",
    encoder: Serial.encI64Le,
    decoder: Serial.decI64Le(),
};

/**
 * A `Model` for `string`.
 */
export const str: Model<string> = {
    clone: (value) => value,
    validate: (value) => typeof value === "string",
    encoder: Serial.encUtf8,
    decoder: Serial.decUtf8(),
};

export type LitType = number | bigint | string;

export const lit = <const L extends LitType>(literal: L): Model<L> => {
    const base = (
        {
            number: num,
            bigint: int,
            string: str,
        } as Record<string, Model<unknown>>
    )[typeof literal];
    if (!base) {
        throw new Error(
            "expect the literal to be one of number, bigint or string",
        );
    }
    return checked(base)((value) => value === literal) as unknown as Model<L>;
};

// Combinators

/**
 * A `Model` for `Array<T>` from the `Model` for `T`.
 */
export const array = <T>(item: Model<T>): Model<T[]> => ({
    clone: (values) => values.map(item.clone),
    validate: (values) => Array.isArray(values) && values.every(item.validate),
    encoder: arrayEncoder(item.encoder),
    decoder: arrayDecoder(item.decoder),
});

/**
 * A `Model` for variants of the model `T` literals.
 */
export const union =
    <T>(m: Model<T>, eq: PartialEq<T>) =>
    <const V extends readonly T[]>(...variants: V): Model<V[number]> => ({
        clone: m.clone,
        validate: (value: unknown): value is V[number] =>
            m.validate(value) &&
            variants.some((variant) => eq.eq(value, variant)),
        encoder: m.encoder,
        decoder: m.decoder,
    });

/**
 * A enum's variant entry `{ key: K, value: T }`.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express generics
export type EnumVariant<S extends Record<string, Model<any>>> = {
    [K in keyof S]: S[K] extends Model<infer T>
        ? {
              type: K;
              value: T;
          }
        : never;
}[keyof S];

/**
 * A `Model` for named variants.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express generics
export const enums = <const S extends Record<string, Model<any>>>(
    schema: S,
): Model<EnumVariant<S>> =>
    Object.keys(schema).length === 0
        ? (never as unknown as Model<EnumVariant<S>>)
        : {
              clone: (variant) =>
                  ({
                      type: variant.type,
                      value: schema[variant.type]!.clone(variant.value),
                  }) as unknown as EnumVariant<S>,
              validate: (variant): variant is EnumVariant<S> =>
                  typeof variant === "object" &&
                  variant !== null &&
                  "type" in variant &&
                  "value" in variant &&
                  typeof variant.type === "string" &&
                  Object.hasOwn(schema, variant.type) &&
                  schema[variant.type]!.validate(variant.value),
              encoder: (variant) =>
                  doT(Serial.monadForCodeM)
                      .run(Serial.encUtf8(variant.type as string))
                      .run(schema[variant.type]!.encoder(variant.value))
                      .finish(() => []),
              decoder: doT(Serial.monadForDecoder)
                  .addM("type", Serial.decUtf8())
                  .addMWith("value", ({ type }) => schema[type]!.decoder)
                  .finish(
                      ({ type, value }) =>
                          ({ type, value }) as unknown as EnumVariant<S>,
                  ),
          };

/**
 * Structural record consisted of `Model`s.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express generics
export type Struct<S extends Record<string, Model<any>>> = {
    [K in keyof S]: S[K] extends Model<infer T> ? T : never;
};

/**
 * A `Model` for structural record.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express generics
export const rec = <const S extends Record<string, Model<any>>>(
    schema: S,
): Model<Struct<S>> => ({
    clone: (struct) =>
        Object.fromEntries(
            Object.entries(struct).map(([key, value]) => [
                key,
                schema[key]!.clone(value),
            ]),
        ) as Struct<S>,
    validate: (struct): struct is Struct<S> =>
        typeof struct === "object" &&
        struct !== null &&
        Object.keys(schema).every(
            (key) =>
                Object.hasOwn(struct, key) &&
                schema[key]!.validate(
                    (struct as { [key]: unknown })[key] as unknown,
                ),
        ),
    encoder: (struct) => {
        const entries = Object.entries(struct);
        return doT(Serial.monadForCodeM)
            .run(Serial.encU32Be(entries.length))
            .finishM(() =>
                foldRArray(
                    ([key, code]: [string, Serial.Code]) =>
                        (acc: Serial.Code): Serial.Code =>
                            doT(Serial.monadForCodeM)
                                .addM("key", Serial.encUtf8(key))
                                .run(code)
                                .finishM(() => acc),
                )(Serial.pureCodeM([]))(
                    entries.map(([key, value]): [string, Serial.Code] => [
                        key,
                        schema[key]!.encoder(value),
                    ]),
                ),
            );
    },
    decoder: recordDecoder(
        Object.fromEntries(
            Object.entries(schema).map(([key, model]) => [key, model.decoder]),
        ),
    ) as Serial.Decoder<Struct<S>>,
});

/**
 * Flattens tuple of model into tuple of its value.
 */
export type Tuple<V> = V extends []
    ? []
    : V extends [Model<infer T>]
      ? [T]
      : V extends [Model<infer H>, ...infer R]
        ? [H, ...Tuple<R>]
        : never;

/**
 * A `Model` for heterogeneous tuple array.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express generics
export const tuple = <const V extends Model<any>[]>(
    ...models: V
): Model<Tuple<V>> => ({
    clone: (tuple) =>
        tuple.map((value, index) => models[index]!.clone(value)) as Tuple<V>,
    validate: (tuple): tuple is Tuple<V> =>
        Array.isArray(tuple) &&
        tuple.every((value, index) => models[index]!.validate(value)),
    encoder: (tuple) =>
        doT(Serial.monadForCodeM)
            .loop(0, (idx) =>
                idx === models.length
                    ? Serial.monadForCodeM.pure(newBreak([]))
                    : doT(Serial.monadForCodeM)
                          .run(models[idx]!.encoder(tuple[idx]))
                          .finish(() => newContinue(idx + 1)),
            )
            .finish(() => []),
    decoder: doT(Serial.monadForDecoder)
        .addWithLoop(
            "values",
            [0, []] as [number, unknown[]],
            ([idx, values]) =>
                idx === models.length
                    ? Serial.monadForDecoder.pure(newBreak(values))
                    : doT(Serial.monadForDecoder)
                          .addM("value", models[idx]!.decoder)
                          .finish(({ value }) =>
                              newContinue<[number, unknown[]]>([
                                  idx + 1,
                                  [...values, value],
                              ]),
                          ),
        )
        .finish(({ values }) => values as Tuple<V>),
});

/**
 * A `Model` with custom checker function.
 *
 * @param base - Underlying type to extends with `checker`.
 * @param checker - Your extra validation.
 * @returns A new `Model` with the custom checker function.
 */
export const checked =
    <T>(base: Model<T>) =>
    <S extends symbol>(
        checker: (value: T) => boolean,
    ): Model<T & Record<S, never>> => ({
        clone: base.clone as (
            value: T & Record<S, never>,
        ) => T & Record<S, never>,
        validate: (value): value is T & Record<S, never> =>
            base.validate(value) && checker(value),
        encoder: base.encoder,
        decoder: base.decoder as Decoder<T & Record<S, never>>,
    });

/**
 * A boolean record by keys `K`.
 */
export type Flags<K> = K extends string[] ? Record<K[number], boolean> : never;

/**
 * A `Model` for `Flags`, boolean record by the keys `K`.
 */
export const flags = <const K extends string[]>(
    ...keys: K
): Model<Flags<K>> => {
    const revMap = new Map(keys.map((v, i) => [v, i]));
    if (revMap.size !== keys.length) {
        throw new Error("`keys` must be unique");
    }
    return {
        clone: (flags) => structuredClone(flags),
        validate: (flags): flags is Flags<K> =>
            typeof flags === "object" &&
            flags !== null &&
            keys.every(
                (key) =>
                    Object.hasOwn(flags, key) &&
                    typeof (flags as { [key]: unknown })[key] === "boolean",
            ),
        encoder: (flags) =>
            doT(Serial.monadForCodeM)
                .loop(0, (byteIndex) =>
                    byteIndex === Math.ceil(keys.length / 8)
                        ? Serial.monadForCodeM.pure(newBreak([]))
                        : doT(Serial.monadForCodeM)
                              .addWithLoop(
                                  "octet",
                                  [0, 0] as [number, number],
                                  ([bitIndex, octet]) =>
                                      bitIndex === 8 ||
                                      byteIndex * 8 + bitIndex === keys.length
                                          ? Serial.monadForCodeM.pure(
                                                newBreak(octet),
                                            )
                                          : Serial.monadForCodeM.pure(
                                                newContinue<[number, number]>([
                                                    bitIndex + 1,
                                                    octet |
                                                        (flags[
                                                            keys[
                                                                byteIndex * 8 +
                                                                    bitIndex
                                                            ]!
                                                        ]
                                                            ? 1 << bitIndex
                                                            : 0),
                                                ]),
                                            ),
                              )
                              .runWith(({ octet }) => Serial.encU8(octet))
                              .finish(() => newContinue(byteIndex + 1)),
                )
                .finish(() => []),
        decoder: doT(Serial.monadForDecoder)
            .addWithLoop(
                "flags",
                [0, {}] as [number, Record<string, boolean>],
                ([byteIndex, flags]) =>
                    byteIndex === Math.ceil(keys.length / 8)
                        ? Serial.monadForDecoder.pure(newBreak(flags))
                        : doT(Serial.monadForDecoder)
                              .addM("octet", Serial.decU8())
                              .addWithLoop(
                                  "partialFlags",
                                  [0, {}] as [number, Record<string, boolean>],
                                  ([bitIndex, partialFlags], { octet }) =>
                                      bitIndex === 8 ||
                                      byteIndex * 8 + bitIndex === keys.length
                                          ? Serial.monadForDecoder.pure(
                                                newBreak(partialFlags),
                                            )
                                          : Serial.monadForDecoder.pure(
                                                newContinue<
                                                    [
                                                        number,
                                                        Record<string, boolean>,
                                                    ]
                                                >([
                                                    bitIndex + 1,
                                                    {
                                                        ...partialFlags,
                                                        [keys[
                                                            byteIndex * 8 +
                                                                bitIndex
                                                        ]!]:
                                                            (octet &
                                                                (1 <<
                                                                    bitIndex)) !==
                                                            0,
                                                    },
                                                ]),
                                            ),
                              )
                              .finish(({ partialFlags }) =>
                                  newContinue<
                                      [number, Record<string, boolean>]
                                  >([
                                      byteIndex + 1,
                                      { ...flags, ...partialFlags },
                                  ]),
                              ),
            )
            .finish(({ flags }) => flags as Flags<K>),
    };
};

/**
 * A primary key type of `Entity`.
 */
declare const entityPrimaryKeyNominal: unique symbol;
export type EntityPrimaryKey<R> = string & { [entityPrimaryKeyNominal]: R };

/**
 * An entity type which has identifier and lifetime (created/updated/deleted).
 */
export type Entity<S> =
    // biome-ignore lint/suspicious/noExplicitAny: needed to express
    S extends Record<string, Model<any>>
        ? Struct<S> & {
              readonly primaryKey: EntityPrimaryKey<Struct<S>>;
              readonly createdAt: DateUtc;
              readonly updatedAt: DateUtc;
              readonly deletedAt: DateUtc;
          }
        : never;

/**
 * A `Model` for `Entity` type with schema for `struct`. It will append fields:
 *
 * - `primaryKey` - An unique identifier,
 * - `createdAt` - Timestamp of created this,
 * - `updatedAt` - Timestamp of updated this,
 * - `deletedAt` - Timestamp of deleted this logically.
 */
// biome-ignore lint/suspicious/noExplicitAny: needed to express
export const entity = <const S extends Record<string, Model<any>>>(
    schema: S,
): Model<Entity<S>> =>
    rec({
        ...schema,
        primaryKey: str as unknown as Model<EntityPrimaryKey<Struct<S>>>,
        createdAt: dateUtc,
        updatedAt: dateUtc,
        deletedAt: dateUtc,
    }) as unknown as Model<Entity<S>>;

declare const entityRefNominal: unique symbol;
/**
 * Reference type to the entity `E`. It is a foreign key of `E`.
 */
export type EntityRef<E> =
    E extends Entity<infer S> ? string & { [entityRefNominal]: S } : never;

/**
 * A `Model` for `EntityRef<E>`, the reference type to the entity `E`.
 */
export const reference = <E>(_entityModel: Model<E>): Model<EntityRef<E>> =>
    str as unknown as Model<EntityRef<E>>;

/**
 * Creates a reference from the entity.
 */
export const newRef = <S>(entity: Entity<S>): EntityRef<Entity<S>> =>
    entity.primaryKey as unknown as EntityRef<Entity<S>>;

// Utilities

/**
 * A `Model` for `Option<T>` from the `Model` for `T`.
 */
export const option = <T>(model: Model<T>): Model<Option.Option<T>> => ({
    clone: Option.map(model.clone),
    validate: (opt): opt is Option.Option<T> =>
        Option.isOption(opt) && Option.mapOr(true)(model.validate)(opt),
    encoder: Option.enc(model.encoder),
    decoder: Option.dec(model.decoder),
});

/**
 * A `Model` for the unit type `never[]`, the empty tuple.
 */
export const unit: Model<never[]> = {
    clone: (unit) => unit,
    validate: (opt): opt is never[] => Array.isArray(opt) && opt.length === 0,
    encoder: Serial.monadForCodeM.pure,
    decoder: Serial.monadForDecoder.pure([]),
};

/**
 * A `Model` for the inhabitant type `never`. Calling `clone`, `encoder` and `decoder` will throw an error.
 */
export const never: Model<never> = {
    clone: () => {
        throw new Error("never cannot clone");
    },
    validate: (value): value is never => false,
    encoder: () => {
        throw new Error("never cannot encoder");
    },
    decoder: () => {
        throw new Error("never cannot decode");
    },
};

/**
 * A `Model` for the string restricted with the regular expression.
 */
export const regExpChecked = <S extends symbol>(
    regExp: RegExp,
): Model<string & Record<S, never>> => checked(str)((s) => regExp.test(s));

declare const dateUtcNominal: unique symbol;
/**
 * An UTC date string of ISO 8601 format `YYYY-MM-DDTHH:mm:ss.sssZ`.
 */
export type DateUtc = string & { [dateUtcNominal]: never };

/**
 * A `Model` for UTC date string of ISO 8601 format `YYYY-MM-DDTHH:mm:ss.sssZ`.
 */
export const dateUtc: Model<DateUtc> = regExpChecked(
    /^±?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/gu,
);

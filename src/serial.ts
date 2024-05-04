/**
 * This package provides serialization/deserialization utilities for `ArrayBuffer`. It is useful for implementing encoder/decoder for you data structure.
 *
 * # Serial Model
 *
 * `Serializer` and `Deserializer` work on `Builder` model. It has these primitives below:
 *
 * - i8/u8
 * - i16/u16
 * - i32/u32
 * - i64/u64
 *
 * And also serializing `string` as UTF-8 sequence is supported by `encUtf8`/`decUtf8`, as a composite builder.
 *
 * Their features are provided as each monad, `monadForCodeM` and `monadForDecoder` respectively. So you can combine them with using these monads and `CatT` system.
 *
 * # Encoder
 *
 * An `Encoder` denotes that
 *
 * # Decoder
 *
 * A `Decoder` denotes that
 *
 * @packageDocumentation
 * @module
 */

import { doT } from "./cat.ts";
import { compose } from "./func.ts";
import type { Get1, Hkt1 } from "./hkt.ts";
import {
    andThen,
    isNone,
    map,
    none,
    type Option,
    some,
    unwrapOr,
    unwrapOrElse,
} from "./option.ts";
import { err, isErr, ok, type Result } from "./result.ts";
import { type Foldable, length, mapMIgnore } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import type { Pure } from "./type-class/pure.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

/**
 * A step of building a serial of binaries. It produces a signal to write data on `range` of bytes.
 */
export type BuildStep<T> = (range: BufferRange) => Promise<BuildSignal<T>>;

/**
 * A range of data bytes that required to build a serial of binaries.
 */
export type BufferRange = [startIndex: number, length: number];

export const buildDoneNominal = Symbol("BuildSignalBuildDone");
export const bufferFullNominal = Symbol("BuildSignalBufferFull");
export const insertChunkNominal = Symbol("BuildSignalInsertChunk");
/**
 * A result of `BuildStep` to report the status of data building process.
 */
export type BuildSignal<T> = Readonly<
    | {
        type: typeof buildDoneNominal;
        /**
         * A position where another one can write into next time.
         */
        nextFreeIndex: number;
        /**
         * A result state of computation.
         */
        computed: T;
    }
    | {
        type: typeof bufferFullNominal;
        /**
         * A minimal buffer size needed to write.
         */
        neededMinimalSize: number;
        /**
         * A position where another one can write into next time.
         */
        currentFreeIndex: number;
        /**
         * A next step that an interpreter should run.
         */
        nextToRun: BuildStep<T>;
    }
    | {
        type: typeof insertChunkNominal;
        /**
         * A position where another one can write into next time.
         */
        currentFreeIndex: number;
        /**
         * A produced binaries that should be inserted.
         */
        toInsert: DataView;
        /**
         * A next step that an interpreter should run.
         */
        nextToRun: BuildStep<T>;
    }
>;

/**
 * Executes a `BuildStep` with handlers and a range of buffer.
 *
 * @param step - An execution target.
 * @param onDone - A handler function called on done of build.
 * @param onBufferFull - A handler function called on out of buffer.
 * @param onInsertChunk - A handler function called on occur chunk data that should be inserted.
 * @param range - A range of data that will be written from now.
 * @returns The result from one of handlers.
 */
export const fillWithBuildStep =
    <T>(step: BuildStep<T>) =>
    <U>(onDone: (nextFreeIndex: number) => (computed: T) => Promise<U>) =>
    (
        onBufferFull: (
            nextMinimalSize: number,
        ) => (
            currentFreeIndex: number,
        ) => (nextToRun: BuildStep<T>) => Promise<U>,
    ) =>
    (
        onInsertChunk: (
            currentFreeIndex: number,
        ) => (toInsert: DataView) => (nextToRun: BuildStep<T>) => Promise<U>,
    ) =>
    async (range: BufferRange): Promise<U> => {
        const signal = await step(range);
        switch (signal.type) {
            case buildDoneNominal:
                return onDone(signal.nextFreeIndex)(signal.computed);
            case bufferFullNominal:
                return onBufferFull(signal.neededMinimalSize)(
                    signal.currentFreeIndex,
                )(signal.nextToRun);
            case insertChunkNominal:
                return onInsertChunk(signal.currentFreeIndex)(signal.toInsert)(
                    signal.nextToRun,
                );
            default:
                throw new Error("unreachable");
        }
    };

/**
 * An identity build step that does nothing.
 */
export const finalStep: BuildStep<[]> = ([start]) =>
    Promise.resolve({
        type: buildDoneNominal,
        nextFreeIndex: start,
        computed: [],
    });

/**
 * A function that transforms between build steps on any type `I`.
 */
export type Builder = <I>(step: BuildStep<I>) => BuildStep<I>;

/**
 * Executes a `Builder` and makes a new build step.
 *
 * @param builder - An execution target.
 * @returns The identity build step, but transformed by the builder.
 */
export const runBuilder = (builder: Builder): BuildStep<[]> =>
    builder(finalStep);

/**
 * An identity builder that does nothing.
 */
export const empty: Builder = (step) => step;

/**
 * Concatenates two builders into one. Note that the order of parameters looks inverted.
 *
 * @param second - A builder that run at second.
 * @param first - A builder that run at first.
 * @returns The concatenated builder.
 */
export const concat =
    (second: Builder) => (first: Builder): Builder => (step) =>
        second(first(step));

/**
 * Flushes empty data to force to output before going on.
 */
export const flush: Builder = (step) => ([start]) =>
    Promise.resolve({
        type: insertChunkNominal,
        currentFreeIndex: start,
        toInsert: new DataView(new ArrayBuffer(0)),
        nextToRun: step,
    });

/**
 * Writes binaries of bytes from a `DataView`.
 *
 * @param bytes - A source view of bytes.
 * @returns The builder that writes binary sequences.
 */
export const bytesBuilder =
    (bytes: DataView): Builder => (step) => ([start, length]) =>
        Promise.resolve(
            length < bytes.byteLength
                ? {
                    type: bufferFullNominal,
                    neededMinimalSize: bytes.byteLength,
                    currentFreeIndex: start,
                    nextToRun: step,
                }
                : {
                    type: insertChunkNominal,
                    currentFreeIndex: start + bytes.byteLength,
                    toInsert: bytes,
                    nextToRun: step,
                },
        );

/**
 * Writes a number as a signed 8-bit integer.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i8Builder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(1));
    view.setInt8(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as a signed 16-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i16BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setInt16(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as a signed 16-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i16LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setInt16(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a number as a signed 32-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as a signed 32-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a bigint as a signed 64-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i64BeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigInt64(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a bigint as a signed 64-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const i64LeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigInt64(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a number as an unsigned 8-bit integer.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u8Builder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(1));
    view.setUint8(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as an unsigned 16-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u16BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as an unsigned 16-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u16LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a number as an unsigned 32-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as an unsigned 32-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a bigint as an unsigned 64-bit integer in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u64BeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a bigint as an unsigned 64-bit integer in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const u64LeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, num, true);
    return bytesBuilder(view);
};

/**
 * Writes a number as floating point number 32-bit in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const f32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as floating point number 32-bit in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const f32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, num, true);
    return bytesBuilder(view);
};
/**
 * Writes a number as floating point number 64-bit in big endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const f64BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, num);
    return bytesBuilder(view);
};
/**
 * Writes a number as floating point number 64-bit in little endian.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const f64LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, num, true);
    return bytesBuilder(view);
};

/**
 * Writes a string as an UTF-8 sequence with its length.
 *
 * @param num - An integer to be written.
 * @returns The new builder.
 */
export const utf8Builder = (text: string): Builder =>
    concat(u32BeBuilder(text.length))(
        bytesBuilder(new DataView(new TextEncoder().encode(text).buffer)),
    );

/**
 * A `Monoid` instance of `Builder`.
 */
export const monoid: Monoid<Builder> = {
    identity: empty,
    combine: (l, r) => concat(l)(r),
    [semiGroupSymbol]: true,
};

/**
 * A strategy for allocation of `ArrayBuffer` on serialization.
 */
export type AllocationStrategy = {
    /**
     * Allocates/reallocates a new `ArrayBuffer`.
     *
     * @param old - When it is `Some`, old buffer and required minimal size on reallocation.
     * @returns The new `ArrayBuffer`.
     */
    allocator: (old: Option<[ArrayBuffer, number]>) => Promise<ArrayBuffer>;
    /**
     * Decides that the current `ArrayBuffer` should be trimmed.
     *
     * @param used - The used length for serialization in the buffer.
     * @param len - The total length of the buffer.
     * @returns Whether the buffer should be trimmed.
     */
    shouldBeTrimmed: (used: number) => (len: number) => boolean;
};

const resize = (targetLen: number) => (buf: ArrayBuffer): ArrayBuffer => {
    const oldArray = new Uint8Array(buf);
    let newLen = buf.byteLength;
    while (newLen < targetLen) {
        newLen *= 2;
    }
    const newBuf = new ArrayBuffer(newLen);
    const newArray = new Uint8Array(newBuf);
    newArray.set(oldArray);
    return newBuf;
};

/**
 * A simple strategy but doesn't decide that it should be trimmed.
 *
 * @param firstLen - An initial size of buffer.
 * @returns The new strategy.
 */
export const untrimmedStrategy = (firstLen: number): AllocationStrategy => ({
    allocator: (old) => {
        if (isNone(old)) {
            return Promise.resolve(
                new ArrayBuffer(firstLen),
            );
        }
        return Promise.resolve(resize(old[1][1])(old[1][0]));
    },
    shouldBeTrimmed: () => () => false,
});

/**
 * A simple strategy that trims only if the used size is less than half of the total size.
 *
 * @param firstLen - An initial size of buffer.
 * @returns The new strategy.
 */
export const safeStrategy = (firstLen: number): AllocationStrategy => ({
    allocator: (old) => {
        if (isNone(old)) {
            return Promise.resolve(
                new ArrayBuffer(firstLen),
            );
        }
        return Promise.resolve(resize(old[1][1])(old[1][0]));
    },
    shouldBeTrimmed: (used) => (len) => 2 * used < len,
});

/**
 * Builds bytes into an `ArrayBuffer` with a `Builder` by custom strategy.
 */
export const intoBytesWith =
    (strategy: AllocationStrategy) =>
    async (builder: Builder): Promise<ArrayBuffer> => {
        let buf = await strategy.allocator(none());
        let currentIndex = 0;
        let step = runBuilder(builder);
        while (true) {
            const signal = await step([
                currentIndex,
                buf.byteLength - currentIndex,
            ]);
            switch (signal.type) {
                case buildDoneNominal:
                    currentIndex = signal.nextFreeIndex;
                    if (
                        strategy.shouldBeTrimmed(currentIndex)(buf.byteLength)
                    ) {
                        buf = resize(currentIndex)(buf);
                    }
                    return buf;
                case bufferFullNominal:
                    buf = await strategy.allocator(
                        some([buf, signal.neededMinimalSize]),
                    );
                    step = signal.nextToRun;
                    currentIndex = signal.currentFreeIndex;
                    break;
                case insertChunkNominal: {
                    const arr = new Uint8Array(buf);
                    arr.set(
                        new Uint8Array(signal.toInsert.buffer),
                        currentIndex,
                    );
                    step = signal.nextToRun;
                    currentIndex = signal.currentFreeIndex;
                    break;
                }
            }
        }
    };

/**
 * Builds bytes into an `ArrayBuffer` with a `Builder`. The buffer is pre-allocated in 4 KiB and driven by `safeStrategy`.
 */
export const intoBytes: (builder: Builder) => Promise<ArrayBuffer> =
    intoBytesWith(safeStrategy(4 * 1024));

/**
 * Encoded result. A tuple of computation result `T` and builder.
 */
export type CodeM<T> = readonly [result: T, builder: Builder];
/**
 * Encoded result, having a void computation result.
 */
export type Code = CodeM<[]>;
/**
 * An `Encoder` that encodes the value of `T` into a `Code`.
 */
export type Encoder<T> = (value: T) => Code;

export interface EncoderHkt extends Hkt1 {
    readonly type: Encoder<this["arg1"]>;
}

/**
 * Retrieves the encoding type from an `Encoder`.
 */
export type Encoding<E> = E extends Encoder<infer T> ? T : never;

/**
 * A `Monoid` instance for `Code`.
 */
export const codeMonoid: Monoid<Code> = {
    identity: [[], empty],
    combine: (l, r) => [[], concat(l[1])(r[1])],
    [semiGroupSymbol]: true,
};

/**
 * An `Encoder` of `Builder`. It just wraps into a tuple.
 * @alias builderEncoder
 */
export const tell: Encoder<Builder> = (b) => [[], b];
/**
 * An `Encoder` of `Builder`. It just wraps into a tuple.
 * @alias tell
 */
export const builderEncoder = tell;

/**
 * Unwraps the `CodeM`'s `Builder`.
 *
 * @param code - An encode result.
 * @returns The contained builder.
 */
export const execCodeM = <T>([, b]: CodeM<T>): Builder => b;

/**
 * Transform a `Code` into an `ArrayBuffer` of byte sequence.
 *
 * @param code - An encode result.
 * @returns The serialized `ArrayBuffer`.
 */
export const runCode = ([, b]: Code): Promise<ArrayBuffer> => intoBytes(b);

/**
 * Transform a `CodeM` into result and `ArrayBuffer` of byte sequence.
 *
 * @param code - An encode result.
 * @returns The result and serialized `ArrayBuffer`.
 */
export const runCodeM = async <T>(
    put: CodeM<T>,
): Promise<readonly [result: T, ArrayBuffer]> => [
    put[0],
    await intoBytes(put[1]),
];

/**
 * Maps the result of computation over `CodeM`.
 *
 * @param f - A function that maps from `T` to `U`.
 * @param code - An encode result to be mapped.
 * @returns The mapped encode result.
 */
export const mapCodeM = <T, U>(f: (t: T) => U) =>
(
    [result, builder]: CodeM<T>,
): CodeM<U> => [
    f(result),
    builder,
];

/**
 * Wraps a value of `T` as a computation result with the builder that does nothing.
 */
export const pureCodeM = <T>(t: T): CodeM<T> => [t, empty];

export const applyCodeM =
    <T, U>(f: CodeM<(t: T) => U>) => (t: CodeM<T>): CodeM<U> => [
        f[0](t[0]),
        concat(f[1])(t[1]),
    ];

export const flatMapCodeM =
    <T, U>(f: (t: T) => CodeM<U>) => (t: CodeM<T>): CodeM<U> => {
        const [a, w] = t;
        const [b, wNew] = f(a);
        return [b, concat(w)(wNew)];
    };

export interface CodeMHkt extends Hkt1 {
    readonly type: CodeM<this["arg1"]>;
}

/**
 * A `Pure` instance for `CodeM<_>`.
 */
export const pureForCodeM: Pure<CodeMHkt> = { pure: pureCodeM };
/**
 * A `Functor` instance for `CodeM<_>`.
 */
export const functorForCodeM: Functor<CodeMHkt> = { map: mapCodeM };
/**
 * A `Monad` instance for `CodeM<_>`.
 */
export const monadForCodeM: Monad<CodeMHkt> = {
    map: mapCodeM,
    pure: pureCodeM,
    apply: applyCodeM,
    flatMap: flatMapCodeM,
};

/**
 * A code that flushes the data to output.
 */
export const flushCode: Code = tell(flush);

/**
 * Encodes nothing. It is an identity encoder.
 */
export const encUnit: Encoder<[]> = compose(tell)(() => empty);

/**
 * Encodes a number as a signed 8-bit integer.
 */
export const encI8: Encoder<number> = compose(tell)(i8Builder);
/**
 * Encodes a number as a signed 16-bit integer in big endian.
 */
export const encI16Be: Encoder<number> = compose(tell)(i16BeBuilder);
/**
 * Encodes a number as a signed 16-bit integer in little endian.
 */
export const encI16Le: Encoder<number> = compose(tell)(i16LeBuilder);
/**
 * Encodes a number as a signed 32-bit integer in big endian.
 */
export const encI32Be: Encoder<number> = compose(tell)(i32BeBuilder);
/**
 * Encodes a number as a signed 32-bit integer in little endian.
 */
export const encI32Le: Encoder<number> = compose(tell)(i32LeBuilder);
/**
 * Encodes a bigint as a signed 64-bit integer in big endian.
 */
export const encI64Be: Encoder<bigint> = compose(tell)(i64BeBuilder);
/**
 * Encodes a bigint as a signed 64-bit integer in little endian.
 */
export const encI64Le: Encoder<bigint> = compose(tell)(i64LeBuilder);

/**
 * Encodes a number as an unsigned 8-bit integer.
 */
export const encU8: Encoder<number> = compose(tell)(u8Builder);
/**
 * Encodes a number as an unsigned 16-bit integer in big endian.
 */
export const encU16Be: Encoder<number> = compose(tell)(u16BeBuilder);
/**
 * Encodes a number as an unsigned 16-bit integer in little endian.
 */
export const encU16Le: Encoder<number> = compose(tell)(u16LeBuilder);
/**
 * Encodes a number as an unsigned 32-bit integer in big endian.
 */
export const encU32Be: Encoder<number> = compose(tell)(u32BeBuilder);
/**
 * Encodes a number as an unsigned 32-bit integer in little endian.
 */
export const encU32Le: Encoder<number> = compose(tell)(u32LeBuilder);
/**
 * Encodes a bigint as an unsigned 64-bit integer in big endian.
 */
export const encU64Be: Encoder<bigint> = compose(tell)(u64BeBuilder);
/**
 * Encodes a bigint as an unsigned 64-bit integer in little endian.
 */
export const encU64Le: Encoder<bigint> = compose(tell)(u64LeBuilder);

/**
 * Encodes a string as UTF-8 sequence with its length.
 */
export const encUtf8: Encoder<string> = compose(tell)(utf8Builder);

/**
 * Encodes a `Foldable` data structure.
 *
 * @param foldable - A `Foldable` instance for `S`.
 * @param encT - An `Encoder` for contained items.
 * @param data - Data to be encoded.
 * @returns The encoded result.
 */
export const encFoldable =
    <S>(foldable: Foldable<S>) =>
    <T>(encT: Encoder<T>): Encoder<Get1<S, T>> =>
    (data: Get1<S, T>): Code =>
        doT(monadForCodeM)
            .run(encU32Be(length(foldable)(data)))
            .finishM(
                () =>
                    mapMIgnore<S, CodeMHkt, T, []>(foldable, monadForCodeM)(
                        encT,
                    )(data),
            );

/**
 * Encodes a sum type value with encoders and functions for index key.
 *
 * @param keyExtractor - A function that extracts the index key of `variantEncoders` from a sum type value.
 * @param keyEncoder - An encoder for the index key value of a sum type value.
 * @param variantEncoders - Encoders for each variant of the sum type.
 * @returns The encoder for the sum type.
 */
export const encSum = <
    O extends object,
    K extends PropertyKey = keyof O,
    T = Encoding<O[keyof O]>,
>(
    variantEncoders: O,
) =>
(keyExtractor: (value: T) => K) =>
(keyEncoder: Encoder<K>): Encoder<T> =>
(value) => {
    const key = keyExtractor(value);
    if (!Object.hasOwn(variantEncoders, key)) {
        throw new Error(
            `entry of key was not owned by the variantEncoders`,
        );
    }
    return doT(monadForCodeM)
        .run(keyEncoder(key))
        .run(
            (variantEncoders[key as unknown as keyof O] as Encoder<T>)(
                value,
            ),
        )
        .finish(() => []);
};

/**
 * A result that reports how many bytes has the data read.
 */
export type ReadLen = Readonly<
    [type: "completed"] | [type: "more", needToRead: Option<number>]
>;

/**
 * Converts a `ReadLen` into an actual bytes, or zero if none.
 */
export const neededLen = (len: ReadLen): number =>
    len[0] === "completed" ? 0 : unwrapOr(0)(len[1]);

/**
 * A nullable data buffer to write temporary.
 */
export type Buffer = Option<DataView>;

/**
 * Creates a new zero-sized buffer that cannot be written.
 */
export const emptyBuffer = (): Buffer => some(new DataView(new ArrayBuffer(0)));

/**
 * Concatenates `DataView`s into one.
 *
 * @param views - `DataView`s to be joined.
 * @returns The concatenated data.
 */
export const concatViews = (views: readonly DataView[]): DataView => {
    const newLen = views.reduce(
        (prev, curr) => prev + curr.byteLength,
        0,
    );
    const newBuf = new ArrayBuffer(newLen);
    const newArray = new Uint8Array(newBuf);
    views.reduce((offset, curr) => {
        newArray.set(new Uint8Array(curr.buffer), offset);
        return offset + curr.byteLength;
    }, 0);
    return new DataView(newBuf);
};

/**
 * Appends a `DataView` after a `Buffer`. Note that the order of parameters looks inverted.
 *
 * @param appending - An appending `DataView`.
 * @param base - A buffer the base of data.
 * @returns The concatenated buffer.
 */
export const extendBuffer = (appending: DataView) => (base: Buffer): Buffer =>
    map((base: DataView): DataView => {
        const newBuf = new ArrayBuffer(base.byteLength + appending.byteLength);
        const newArray = new Uint8Array(newBuf);
        newArray.set(new Uint8Array(base.buffer));
        newArray.set(new Uint8Array(appending.buffer), base.byteLength);
        return new DataView(newBuf);
    })(base);

/**
 * Appends a `Buffer` after a `Buffer`. Note that the order of parameters looks inverted.
 *
 * @param appending - An appending `Buffer`.
 * @param base - A buffer the base of data.
 * @returns The concatenated buffer.
 */
export const appendBuffer = (appending: Buffer) => (base: Buffer): Buffer =>
    andThen((appending: DataView) => extendBuffer(appending)(base))(appending);

/**
 * Extracts a sequence of data bytes from a `Buffer`.
 *
 * @param buf - A target to extract.
 * @returns The internal sequence of bytes, or `empty` if none.
 */
export const bufferBytes = (buf: Buffer): DataView =>
    unwrapOrElse(() => new DataView(new ArrayBuffer(0)))(buf);

/**
 * A context while decoding the byte sequence.
 */
export type DecContext = {
    /**
     * An input data parsing now,
     */
    input: DataView;
    /**
     * A buffer to store the loaded chunk of data.
     */
    buffer: Buffer;
    /**
     * How many bytes is needed to read more.
     */
    more: ReadLen;
    /**
     * An offset index of reading.
     */
    offset: number;
};

export const failureNominal = Symbol("ParseResultFailure");
export const partialNominal = Symbol("ParseResultPartial");
export const parseDoneNominal = Symbol("ParseResultParseDone");
/**
 * A result of parsing with a state `S`.
 */
export type ParseResult<S> = Readonly<
    | {
        type: typeof failureNominal;
        /**
         * An error message.
         */
        message: string;
        /**
         * An input data that occurs a failure.
         */
        input: DataView;
    }
    | {
        type: typeof partialNominal;
        /**
         * A function for to continue to parse.
         *
         * @param buf - The buffer having the rest of data.
         * @returns The new result of parsing.
         */
        resume: (buf: ArrayBufferLike) => ParseResult<S>;
    }
    | {
        type: typeof parseDoneNominal;
        /**
         * A computation result state.
         */
        state: S;
        /**
         * An unused byte sequence on parsing.
         */
        rest: DataView;
    }
>;

/**
 * A function that handles an error on parsing by a `Decoder`.
 *
 * @param ctx - A context of decoding.
 * @param trace - Stack trace of decoder invocation.
 * @param message - Error messages.
 * @returns The result of parsing. It is usually a `failure`.
 */
export type FailureHandler<S> = (
    ctx: DecContext,
) => (trace: readonly string[]) => (message: string) => ParseResult<S>;
/**
 * A function that handles a success on parsing by a `Decoder`.
 *
 * @param ctx - A context of decoding.
 * @param result - A parsed item.
 * @returns The result of parsing. It is usually a `done`.
 */
export type SuccessHandler<T, S> = (
    ctx: DecContext,
) => (result: T) => ParseResult<S>;

/**
 * A `Decoder` denotes the process that parses an item `T` from a sequence of bytes.
 *
 * @param ctx - A context of decoding.
 * @param onFailure - A handler function called when failed.
 * @param onSuccess - A handler function called when succeed.
 * @returns The result of parsing.
 */
export type Decoder<T> = <S>(
    ctx: DecContext,
) => (
    onFailure: FailureHandler<S>,
) => (onSuccess: SuccessHandler<T, S>) => ParseResult<S>;

/**
 * Decodes a raw bytes sequence. It is the most primitive decoder.
 */
export const decodeRaw: Decoder<DataView> = (ctx) => () => (onS) =>
    onS(ctx)(ctx.input);

/**
 * Overwrites a raw bytes sequence with `data` from the position of `offset`.
 *
 * @param data - Source to write.
 * @param offset - Start position to overwrite.
 * @returns The overwriting decoder.
 */
export const putRaw =
    (data: DataView) => (offset: number): Decoder<[]> => (ctx) => () => (onS) =>
        onS({ ...ctx, input: data, offset })([]);

/**
 * Labels the stack trace with `note`. It is used for reporting an error on failure.
 *
 * @param note - The note for the stack trace.
 * @returns The labeled decoder.
 */
export const label =
    (note: string) =>
    <T>(d: Decoder<T>): Decoder<T> =>
    (ctx1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<T, S>) =>
        d<S>(ctx1)((ctx2) => (trace) => onF(ctx2)([...trace, note]))(
            onS,
        );

export const mapDecoder =
    <T, U>(f: (t: T) => U) =>
    (d: Decoder<T>): Decoder<U> =>
    (ctx) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        d<S>(ctx)(onF)((ctx) => (res) => onS(ctx)(f(res)));

export const pureDecoder = <T>(item: T): Decoder<T> => (ctx) => () => (onS) =>
    onS(ctx)(item);

export const applyDecoder =
    <T, U>(f: Decoder<(t: T) => U>) =>
    (d: Decoder<T>): Decoder<U> =>
    (ctx1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        f<S>(ctx1)(onF)((ctx2) => (fn) =>
            d<S>(ctx2)(onF)((ctx3) => (t) => onS(ctx3)(fn(t)))
        );

export const flatMapDecoder =
    <T, U>(f: (t: T) => Decoder<U>) =>
    (d: Decoder<T>): Decoder<U> =>
    (ctx1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        d<S>(ctx1)(onF)((ctx2) => (t) => f(t)<S>(ctx2)(onF)(onS));

/**
 * Creates a decoder that always fails. It is useful for reporting a parse error with `Pure.when`.
 *
 * @param message - The error message.
 * @returns The failing decoder.
 */
export const failDecoder =
    (message: string): Decoder<[]> => (ctx) => (onF) => () =>
        onF(ctx)([])("read failure: " + message);

export interface DecoderHkt extends Hkt1 {
    readonly type: Decoder<this["arg1"]>;
}

/**
 * A `Pure` instance for `Decoder<_>`.
 */
export const pureForDecoder: Pure<DecoderHkt> = { pure: pureDecoder };
/**
 * A `Functor` instance for `Decoder<_>`.
 */
export const functorForDecoder: Functor<DecoderHkt> = { map: mapDecoder };
/**
 * A `Monad` instance for `Decoder<_>`.
 */
export const monadForDecoder: Monad<DecoderHkt> = {
    map: mapDecoder,
    pure: pureDecoder,
    apply: applyDecoder,
    flatMap: flatMapDecoder,
};

/**
 * The default failure handler. It tells a `failure` with an error message about the stack trace.
 */
export const onFailureIdentity =
    <S>(): FailureHandler<S> => (ctx) => (trace) => (msg) => ({
        type: failureNominal,
        message: `${msg}\n${
            trace.map((entry, i) => `${i + 1}: ${entry}`).join("\n")
        }`,
        input: ctx.input,
    });

/**
 * The default success handler. It tells a `done` with the computation result.
 */
export const onSuccessIdentity =
    <T>(): SuccessHandler<T, T> => (ctx) => (result) => ({
        type: parseDoneNominal,
        state: result,
        rest: new DataView(ctx.input.buffer.slice(ctx.offset)),
    });

/**
 * Executes a `Decoder` with a whole source data.
 *
 * @param decoder - A decoder to run.
 * @param data - Source data.
 * @returns The parsing result on success, or error messages of string on failure.
 */
export const runDecoder =
    <T>(decoder: Decoder<T>) => (data: ArrayBufferLike): Result<string, T> => {
        const res = decoder<T>({
            input: new DataView(data),
            buffer: none(),
            more: ["completed"],
            offset: 0,
        })(onFailureIdentity())(
            onSuccessIdentity(),
        );
        switch (res.type) {
            case failureNominal:
                return err(res.message);
            case parseDoneNominal:
                return ok(res.state);
            case partialNominal:
                return err("unexpected partial result");
        }
    };

/**
 * Executes a `Decoder` lazily with a length hint.
 *
 * @param decoder - A decoder to run.
 * @param len - A remaining length of data if exists.
 * @param input - Input data chunk whose currently available.
 * @returns The parsing result.
 */
export const runDecoderChunk =
    <T>(decoder: Decoder<T>) =>
    (len: Option<number>) =>
    (input: DataView): ParseResult<T> =>
        decoder<T>({ input, buffer: none(), more: ["more", len], offset: 0 })(
            onFailureIdentity(),
        )(onSuccessIdentity());

/**
 * Executes a `Decoder` lazily.
 *
 * @param decoder - A decoder to run.
 * @param len - A remaining length of data if exists.
 * @param input - Input data chunk whose currently available.
 * @returns The parsing result.
 */
export const runDecoderPartial = <T>(
    decoder: Decoder<T>,
): (input: DataView) => ParseResult<T> => runDecoderChunk(decoder)(none());

/**
 * Executes a `Decoder` with a whole source data and returns the unused rest.
 *
 * @param decoder - A decoder to run.
 * @param input - Source data.
 * @param offset - An offset position of reading data.
 * @returns The parsing result on success or error messages on failure, and the unused rest of `input`.
 */
export const runDecoderStateAndRest =
    <T>(decoder: Decoder<T>) =>
    (input: DataView) =>
    (offset: number): readonly [result: Result<string, T>, rest: DataView] => {
        const res = decoder<T>({
            input: new DataView(input.buffer.slice(offset)),
            buffer: none(),
            more: ["completed"],
            offset: 0,
        })(onFailureIdentity())(onSuccessIdentity());
        switch (res.type) {
            case failureNominal:
                return [err(res.message), res.input];
            case parseDoneNominal:
                return [ok(res.state), res.rest];
            case partialNominal:
                return [err(""), new DataView(new ArrayBuffer(0))];
        }
    };

/**
 * Executes a `Decoder` with a whole source data and returns the unused rest.
 *
 * @param decoder - A decoder to run.
 * @param input - Source data.
 * @param offset - An offset position of reading data.
 * @returns The parsing result and the unused rest of `input` on success, or error messages on failure.
 */
export const runDecoderState =
    <T>(g: Decoder<T>) =>
    (input: DataView) =>
    (offset: number): Result<string, readonly [result: T, rest: DataView]> => {
        const res = runDecoderStateAndRest(g)(input)(offset);
        if (isErr(res[0])) {
            return err(res[0][1]);
        }
        return ok([res[0][1], res[1]] as const);
    };

/**
 * Ensures that the input data have `atLeast` bytes at least. It fails when not enough.
 *
 * @param atLeast - A number of bytes that you need to read.
 * @returns The checking decoder that extracts the slice of data.
 */
export const ensure =
    (atLeast: number): Decoder<DataView> =>
    (ctx) =>
    (onFailure) =>
    (onSuccess) => {
        const moreRequiredLen = atLeast - ctx.input.byteLength;
        if (moreRequiredLen <= 0) {
            return onSuccess(ctx)(ctx.input);
        }
        const finalInput =
            (input: DataView) => (acc: readonly DataView[]): DataView =>
                concatViews([input, ...acc].toReversed());
        const finalBuffer =
            (base: Buffer) =>
            (input: DataView) =>
            (acc: readonly DataView[]): Buffer =>
                extendBuffer(concatViews(
                    [input, ...acc].toReversed().slice(1),
                ))(base);
        const getMore =
            (ctx: DecContext) =>
            (acc: readonly DataView[]) =>
            <S>(onFailure: FailureHandler<S>) =>
            (onSuccess: SuccessHandler<DataView, S>): ParseResult<S> => {
                const tooFewBytes = () => {
                    const input = finalInput(ctx.input)(acc);
                    const buffer = finalBuffer(ctx.buffer)(ctx.input)(acc);
                    return onFailure({ ...ctx, input, buffer })([
                        "demandInput",
                    ])("too few bytes");
                };
                if (ctx.more[0] === "completed") {
                    return tooFewBytes();
                }
                const [, moreRequired] = ctx.more;
                return {
                    type: partialNominal,
                    resume: (b) => {
                        if (b.byteLength === 0) {
                            return tooFewBytes();
                        }
                        const moreReading = map((len: number) =>
                            len - b.byteLength
                        )(moreRequired);
                        return checkIfEnough({
                            ...ctx,
                            input: new DataView(b),
                            more: ["more", moreReading],
                        })(acc)(onFailure)(onSuccess);
                    },
                };
            };
        const checkIfEnough =
            (ctx: DecContext) =>
            (acc: readonly DataView[]) =>
            <S>(onFailure: FailureHandler<S>) =>
            (onSuccess: SuccessHandler<DataView, S>): ParseResult<S> => {
                const restLen = ctx.offset - ctx.input.byteLength;
                if (restLen <= 0) {
                    const input = finalInput(ctx.input)(acc);
                    const buffer = finalBuffer(ctx.buffer)(ctx.input)(acc);
                    return onSuccess({ ...ctx, input, buffer })(input);
                }
                return getMore({ ...ctx, offset: restLen })(acc)(onFailure)(
                    onSuccess,
                );
            };
        return getMore(ctx)([])(onFailure)(onSuccess);
    };

const splitAt = (firstLen: number) =>
(
    data: DataView,
): [left: DataView, right: DataView] => {
    const src = new Uint8Array(data.buffer);
    const leftBuf = new ArrayBuffer(Math.min(firstLen, data.byteLength));
    const rightBuf = new ArrayBuffer(Math.max(data.byteLength - firstLen, 0));
    new Uint8Array(leftBuf).set(src);
    new Uint8Array(rightBuf).set(src.slice(firstLen));
    return [new DataView(leftBuf), new DataView(rightBuf)];
};

/**
 * Isolates the input data such that `decoder` can read only `blockLen` bytes of data. The rest is hidden and used only successors.
 *
 * It fails when the input data don't have enough bytes.
 *
 * @param blockLen - A number of block bytes to read.
 * @param decoder - A decoder to be isolated.
 * @returns The isolated decoder.
 */
export const isolate =
    (blockLen: number) => <T>(decoder: Decoder<T>): Decoder<T> =>
        doT(monadForDecoder)
            .when(
                () => blockLen < 0,
                () => failDecoder("block length must not be negative"),
            )
            .addM("bytes", ensure(blockLen))
            .addWith("splitted", ({ bytes }) => splitAt(blockLen)(bytes))
            .addM("curr", parsedBytes)
            .runWith(({ splitted, curr }) => putRaw(splitted[0])(curr))
            .addM("value", decoder)
            .addM("raw", decodeRaw)
            .when(
                ({ raw }) => raw.byteLength === 0,
                () => failDecoder("not all bytes parsed"),
            )
            .runWith(({ splitted, curr }) =>
                putRaw(splitted[1])(curr + blockLen)
            )
            .finish(({ value }) => value);

/**
 * Skips `count` bytes of the input data.
 *
 * @param count - The number of bytes to skip.
 * @returns The skipping decoder.
 */
export const skip = (count: number): Decoder<[]> =>
    doT(monadForDecoder)
        .addM("bytes", ensure(count))
        .addM("curr", parsedBytes)
        .finishM(({ bytes, curr }) =>
            putRaw(
                new DataView(new Uint8Array(bytes.buffer).slice(count).buffer),
            )(
                curr + count,
            )
        );

/**
 * Looks ahead values from the input data without consuming and collects to the buffer.
 *
 * @param decoder - A decoder to look ahead.
 * @returns The data collecting decoder.
 */
export const lookAhead =
    <T>(decoder: Decoder<T>): Decoder<T> =>
    (ctx) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<T, S>) =>
        decoder<S>({ ...ctx, buffer: emptyBuffer() })((ctxF) =>
            onF({
                ...ctxF,
                input: ctx.input,
                buffer: appendBuffer(ctxF.buffer)(ctx.buffer),
            })
        )((ctxS) =>
            onS({
                ...ctxS,
                input: concatViews([ctx.input, bufferBytes(ctxS.buffer)]),
                buffer: appendBuffer(ctxS.buffer)(ctx.buffer),
            })
        );

/**
 * Looks ahead a `some` value from the input data. If the result is `none`, the input data will be recovered.
 *
 * @param decoder - A decoder to look ahead.
 * @returns The data collecting decoder.
 */
export const lookAheadSome = <T>(
    decoder: Decoder<Option<T>>,
): Decoder<Option<T>> =>
    doT(monadForDecoder)
        .addM("bytes", decodeRaw)
        .addM("pre", parsedBytes)
        .addM("opt", decoder)
        .when(
            ({ opt }) => isNone(opt),
            ({ bytes, pre }) => putRaw(bytes)(pre),
        )
        .finish(({ opt }) => opt);

/**
 * Looks ahead a `ok` value from the input data. If the result is `err`, the input data will be recovered.
 *
 * @param decoder - A decoder to look ahead.
 * @returns The data collecting decoder.
 */
export const lookAheadOk = <E, T>(
    g: Decoder<Result<E, T>>,
): Decoder<Result<E, T>> =>
    doT(monadForDecoder)
        .addM("bytes", decodeRaw)
        .addM("pre", parsedBytes)
        .addM("res", g)
        .when(
            ({ res }) => isErr(res),
            ({ bytes, pre }) => putRaw(bytes)(pre),
        )
        .finish(({ res }) => res);

/**
 * Gets the length of bytes which has already read.
 */
export const parsedBytes: Decoder<number> = (ctx) => () => (onS) =>
    onS(ctx)(ctx.offset);

/**
 * Gets the length of bytes which has not read yet.
 */
export const unparsedBytes: Decoder<number> = (ctx) => () => (onS) =>
    onS(ctx)(ctx.input.byteLength + neededLen(ctx.more));

/**
 * Checks whether the input has remaining bytes.
 */
export const isEmpty: Decoder<boolean> = (ctx) => () => (onS) =>
    onS(ctx)(ctx.input.byteLength === 0 && neededLen(ctx.more) === 0);

/**
 * Slices `nBytes` bytes of data from the input.
 *
 * @param nBytes - The length of bytes sequence you want.
 * @returns The slicing decoder.
 */
export const decBytes = (nBytes: number): Decoder<DataView> =>
    doT(monadForDecoder)
        .addM("bytes", ensure(nBytes))
        .addWith("splitted", ({ bytes }) => splitAt(nBytes)(bytes))
        .addM("curr", parsedBytes)
        .runWith(({ splitted, curr }) => putRaw(splitted[1])(curr + nBytes))
        .finish(({ splitted }) => splitted[0]);

/**
 * Decodes one byte from the input as a signed 8-bit integer.
 */
export const decI8 = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(1))
        .finish(({ view }) => view.getInt8(0));
/**
 * Decodes two bytes from the input as a signed 16-bit integer in big endian.
 */
export const decI16Be = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(2))
        .finish(({ view }) => view.getInt16(0));
/**
 * Decodes two bytes from the input as a signed 16-bit integer in little endian.
 */
export const decI16Le = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(2))
        .finish(({ view }) => view.getInt16(0, true));
/**
 * Decodes four bytes from the input as a signed 32-bit integer in big endian.
 */
export const decI32Be = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(4))
        .finish(({ view }) => view.getInt32(0));
/**
 * Decodes four bytes from the input as a signed 32-bit integer in little endian.
 */
export const decI32Le = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(4))
        .finish(({ view }) => view.getInt32(0, true));
/**
 * Decodes eight bytes from the input as a signed 64-bit integer in big endian.
 */
export const decI64Be = (): Decoder<bigint> =>
    doT(monadForDecoder)
        .addM("view", decBytes(8))
        .finish(({ view }) => view.getBigInt64(0));
/**
 * Decodes eight bytes from the input as a signed 64-bit integer in little endian.
 */
export const decI64Le = (): Decoder<bigint> =>
    doT(monadForDecoder)
        .addM("view", decBytes(8))
        .finish(({ view }) => view.getBigInt64(0, true));

/**
 * Decodes one byte from the input as an unsigned 8-bit integer.
 */
export const decU8 = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(1))
        .finish(({ view }) => view.getUint8(0));
/**
 * Decodes two bytes from the input as an unsigned 16-bit integer in big endian.
 */
export const decU16Be = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(2))
        .finish(({ view }) => view.getUint16(0));
/**
 * Decodes two bytes from the input as an unsigned 16-bit integer in little endian.
 */
export const decU16Le = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(2))
        .finish(({ view }) => view.getUint16(0, true));
/**
 * Decodes four bytes from the input as an unsigned 32-bit integer in big endian.
 */
export const decU32Be = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(4))
        .finish(({ view }) => view.getUint32(0));
/**
 * Decodes four bytes from the input as an unsigned 32-bit integer in little endian.
 */
export const decU32Le = (): Decoder<number> =>
    doT(monadForDecoder)
        .addM("view", decBytes(4))
        .finish(({ view }) => view.getUint32(0, true));
/**
 * Decodes eight bytes from the input as an unsigned 64-bit integer in big endian.
 */
export const decU64Be = (): Decoder<bigint> =>
    doT(monadForDecoder)
        .addM("view", decBytes(8))
        .finish(({ view }) => view.getBigUint64(0));
/**
 * Decodes eight bytes from the input as an unsigned 64-bit integer in little endian.
 */
export const decU64Le = (): Decoder<bigint> =>
    doT(monadForDecoder)
        .addM("view", decBytes(8))
        .finish(({ view }) => view.getBigUint64(0, true));

/**
 * Decodes bytes from the input as an UTF-8 sequence with its length.
 */
export const decUtf8 = (): Decoder<string> =>
    doT(monadForDecoder)
        .addM("len", decU32Be())
        .addMWith("bytes", ({ len }) => decBytes(len))
        .finish(({ bytes }) => new TextDecoder().decode(bytes));

/**
 * Decodes a sum type value with the `keyDecoder` and `decoders`.
 *
 * @param keyDecoder - A decoder that decodes the index key of the sum type.
 * @param variantDecoders - A table of decoders for each variant of the sum type.
 * @returns The sum type decoder.
 */
export const decSum =
    <K extends PropertyKey>(keyDecoder: Decoder<K>) =>
    <T>(variantDecoders: Record<K, Decoder<T>>): Decoder<T> =>
        doT(monadForDecoder)
            .addM("key", keyDecoder)
            .when(
                ({ key }) => !Object.hasOwn(variantDecoders, key),
                () =>
                    failDecoder(
                        "entry of key was not owned by the variantDecoders",
                    ),
            )
            .finishM(({ key }) => variantDecoders[key]);

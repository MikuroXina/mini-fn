/**
 * This package provides serialization/deserialization utilities for `ArrayBuffer`.
 *
 * # Recipe Model
 *
 * `Serializer` and `Deserializer` work on its own recipe model. It has these primitives:
 *
 * - Number
 *
 * @packageDocumentation
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
import { Foldable, length, mapMIgnore } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { type Pure, when } from "./type-class/pure.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

export type BuildStep<T> = (range: BufferRange) => Promise<BuildSignal<T>>;

export type BufferRange = [startIndex: number, length: number];

export const doneNominal = Symbol("BuildSignalDone");
export const bufferFullNominal = Symbol("BuildSignalBufferFull");
export const insertChunkNominal = Symbol("BuildSignalInsertChunk");
export type BuildSignal<T> = Readonly<
    | { type: typeof doneNominal; nextFreeIndex: number; computed: T }
    | {
        type: typeof bufferFullNominal;
        neededMinimalSize: number;
        currentFreeIndex: number;
        nextToRun: BuildStep<T>;
    }
    | {
        type: typeof insertChunkNominal;
        currentFreeIndex: number;
        toInsert: DataView;
        nextToRun: BuildStep<T>;
    }
>;

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
            case doneNominal:
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

export const finalStep: BuildStep<[]> = ([start]) =>
    Promise.resolve({ type: doneNominal, nextFreeIndex: start, computed: [] });

export type Builder = <I>(step: BuildStep<I>) => BuildStep<I>;

export const runBuilder = (builder: Builder): BuildStep<[]> =>
    builder(finalStep);

export const empty: Builder = (step) => (range) => step(range);

export const concat =
    (second: Builder) => (first: Builder): Builder => (step) =>
        second(first(step));

export const flush: Builder = (step) => ([start]) =>
    Promise.resolve({
        type: insertChunkNominal,
        currentFreeIndex: start,
        toInsert: new DataView(new ArrayBuffer(0)),
        nextToRun: step,
    });

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

export const i8Builder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(1));
    view.setInt8(0, num);
    return bytesBuilder(view);
};
export const i16BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setInt16(0, num);
    return bytesBuilder(view);
};
export const i16LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setInt16(0, num, true);
    return bytesBuilder(view);
};
export const i32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, num);
    return bytesBuilder(view);
};
export const i32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, num, true);
    return bytesBuilder(view);
};
export const i64BeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigInt64(0, num);
    return bytesBuilder(view);
};
export const i64LeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigInt64(0, num, true);
    return bytesBuilder(view);
};
export const u8Builder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(1));
    view.setUint8(0, num);
    return bytesBuilder(view);
};
export const u16BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, num);
    return bytesBuilder(view);
};
export const u16LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, num, true);
    return bytesBuilder(view);
};
export const u32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, num);
    return bytesBuilder(view);
};
export const u32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, num, true);
    return bytesBuilder(view);
};
export const u64BeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, num);
    return bytesBuilder(view);
};
export const u64LeBuilder = (num: bigint): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, num, true);
    return bytesBuilder(view);
};

export const f32BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, num);
    return bytesBuilder(view);
};
export const f32LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, num, true);
    return bytesBuilder(view);
};
export const f64BeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, num);
    return bytesBuilder(view);
};
export const f64LeBuilder = (num: number): Builder => {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, num, true);
    return bytesBuilder(view);
};

export const utf8Builder = (text: string): Builder =>
    concat(u32BeBuilder(text.length))(
        bytesBuilder(new DataView(new TextEncoder().encode(text).buffer)),
    );

export const monoid: Monoid<Builder> = {
    identity: empty,
    combine: (l, r) => concat(l)(r),
    [semiGroupSymbol]: true,
};

export type AllocationStrategy = {
    allocator: (old: Option<[ArrayBuffer, number]>) => Promise<ArrayBuffer>;
    defaultLen: number;
    shouldBeTrimmed: (used: number) => (len: number) => boolean;
};

const resize = (newLen: number) => (buf: ArrayBuffer): ArrayBuffer => {
    const oldArray = new Uint8Array(buf);
    const newBuf = new ArrayBuffer(newLen);
    const newArray = new Uint8Array(newBuf);
    newArray.set(oldArray);
    return newBuf;
};

export const untrimmedStrategy =
    (firstLen: number) => (bufLen: number): AllocationStrategy => ({
        allocator: (old) => {
            if (isNone(old)) {
                return Promise.resolve(
                    new ArrayBuffer(firstLen),
                );
            }
            return Promise.resolve(resize(old[1][1])(old[1][0]));
        },
        defaultLen: bufLen,
        shouldBeTrimmed: () => () => false,
    });

export const safeStrategy =
    (firstLen: number) => (bufLen: number): AllocationStrategy => ({
        allocator: (old) => {
            if (isNone(old)) {
                return Promise.resolve(
                    new ArrayBuffer(firstLen),
                );
            }
            return Promise.resolve(resize(old[1][1])(old[1][0]));
        },
        defaultLen: bufLen,
        shouldBeTrimmed: (used) => (len) => 2 * used < len,
    });

export const intoBytesWith =
    (strategy: AllocationStrategy) =>
    async (builder: Builder): Promise<ArrayBuffer> => {
        while (true) {
            let buf = await strategy.allocator(none());
            let currentIndex = 0;
            let step = runBuilder(builder);
            const signal = await step([
                currentIndex,
                buf.byteLength - currentIndex,
            ]);
            switch (signal.type) {
                case doneNominal:
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

export const intoBytes: (builder: Builder) => Promise<ArrayBuffer> =
    intoBytesWith(safeStrategy(4 * 1024)(32 * 1024));

//
// # Encoder
//

export type CodeM<T> = readonly [result: T, builder: Builder];
export type Code = CodeM<[]>;
export type Encoder<T> = (value: T) => Code;

export const codeMonoid: Monoid<Code> = {
    identity: [[], empty],
    combine: (l, r) => [[], concat(l[1])(r[1])],
    [semiGroupSymbol]: true,
};

export const tell: Encoder<Builder> = (b) => [[], b] as const;
export const builderEncoder = tell;

export const execCodeM = <T>([, b]: CodeM<T>): Builder => b;

export const runCode = ([, b]: Code): Promise<ArrayBuffer> => intoBytes(b);

export const runCodeM = async <T>(
    put: CodeM<T>,
): Promise<readonly [result: T, ArrayBuffer]> => [
    put[0],
    await intoBytes(put[1]),
];

export const mapCodeM = <T, U>(f: (t: T) => U) =>
(
    [result, builder]: CodeM<T>,
): CodeM<U> => [
    f(result),
    builder,
];

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

export const pureForCodeM: Pure<CodeMHkt> = { pure: pureCodeM };
export const functorForCodeM: Functor<CodeMHkt> = { map: mapCodeM };
export const monadForCodeM: Monad<CodeMHkt> = {
    map: mapCodeM,
    pure: pureCodeM,
    apply: applyCodeM,
    flatMap: flatMapCodeM,
};

export const flushCode: Code = tell(flush);

export const encI8: Encoder<number> = compose(tell)(i8Builder);
export const encI16Be: Encoder<number> = compose(tell)(i16BeBuilder);
export const encI16Le: Encoder<number> = compose(tell)(i16LeBuilder);
export const encI32Be: Encoder<number> = compose(tell)(i32BeBuilder);
export const encI32Le: Encoder<number> = compose(tell)(i32LeBuilder);
export const encI64Be: Encoder<bigint> = compose(tell)(i64BeBuilder);
export const encI64Le: Encoder<bigint> = compose(tell)(i64LeBuilder);

export const encU8: Encoder<number> = compose(tell)(u8Builder);
export const encU16Be: Encoder<number> = compose(tell)(u16BeBuilder);
export const encU16Le: Encoder<number> = compose(tell)(u16LeBuilder);
export const encU32Be: Encoder<number> = compose(tell)(u32BeBuilder);
export const encU32Le: Encoder<number> = compose(tell)(u32LeBuilder);
export const encU64Be: Encoder<bigint> = compose(tell)(u64BeBuilder);
export const encU64Le: Encoder<bigint> = compose(tell)(u64LeBuilder);

export const encUtf8: Encoder<string> = compose(tell)(utf8Builder);

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

//
// Decoder
//

export type ReadLen = Readonly<
    [type: "completed"] | [type: "more", needToRead: Option<number>]
>;

export const neededLen = (len: ReadLen): number =>
    len[0] === "completed" ? 0 : unwrapOr(0)(len[1]);

export type Buffer = Option<DataView>;

export const emptyBuffer: Buffer = some(new DataView(new ArrayBuffer(0)));

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

export const extendBuffer = (appending: DataView) => (base: Buffer): Buffer =>
    map((base: DataView): DataView => {
        const newBuf = new ArrayBuffer(base.byteLength + appending.byteLength);
        const newArray = new Uint8Array(newBuf);
        newArray.set(new Uint8Array(base.buffer));
        newArray.set(new Uint8Array(appending.buffer), base.byteLength);
        return new DataView(newBuf);
    })(base);

export const appendBuffer = (appending: Buffer) => (base: Buffer): Buffer =>
    andThen((appending: DataView) => extendBuffer(appending)(base))(appending);

export const bufferBytes = (buf: Buffer): DataView =>
    unwrapOrElse(() => new DataView(new ArrayBuffer(0)))(buf);

export type DecContext = {
    input: DataView;
    buffer: Buffer;
    more: ReadLen;
};

export type ParseResult<S> = Readonly<
    | { type: "failure"; message: string; input: DataView }
    | { type: "partial"; resume: (buf: ArrayBufferLike) => ParseResult<S> }
    | { type: "done"; state: S; rest: DataView }
>;

export type FailureHandler<S> = (
    ctx: DecContext,
) => (trace: readonly string[]) => (message: string) => ParseResult<S>;
export type SuccessHandler<T, S> = (
    ctx: DecContext,
) => (offset: number) => (result: T) => ParseResult<S>;

export type Decoder<T> = <S>(
    ctx: DecContext,
) => (
    offset: number,
) => (
    onFailure: FailureHandler<S>,
) => (onSuccess: SuccessHandler<T, S>) => ParseResult<S>;

export const decodeRaw: Decoder<DataView> = (ctx) => (offset) => () => (onS) =>
    onS(ctx)(offset)(ctx.input);

export const putRaw =
    (data: DataView) =>
    (offset: number): Decoder<[]> =>
    (ctx) =>
    () =>
    () =>
    (onS) => onS({ ...ctx, input: data })(offset)([]);

export const label =
    (note: string) =>
    <T>(g: Decoder<T>): Decoder<T> =>
    (ctx1) =>
    (offset1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<T, S>) =>
        g<S>(ctx1)(offset1)((ctx2) => (trace) => onF(ctx2)([...trace, note]))(
            onS,
        );

export const mapDecoder =
    <T, U>(f: (t: T) => U) =>
    (g: Decoder<T>): Decoder<U> =>
    (ctx) =>
    (offset) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        g<S>(ctx)(offset)(onF)((ctx) => (offset) => (res) =>
            onS(ctx)(offset)(f(res))
        );

export const pureDecoder =
    <T>(item: T): Decoder<T> => (ctx) => (offset) => () => (onS) =>
        onS(ctx)(offset)(item);

export const applyDecoder =
    <T, U>(f: Decoder<(t: T) => U>) =>
    (g: Decoder<T>): Decoder<U> =>
    (ctx1) =>
    (offset1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        f<S>(ctx1)(offset1)(onF)((ctx2) => (offset2) => (fn) =>
            g<S>(ctx2)(offset2)(onF)((ctx3) => (offset3) => (t) =>
                onS(ctx3)(offset3)(fn(t))
            )
        );

export const flatMapDecoder =
    <T, U>(f: (t: T) => Decoder<U>) =>
    (g: Decoder<T>): Decoder<U> =>
    (ctx1) =>
    (offset1) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<U, S>) =>
        g<S>(ctx1)(offset1)(onF)((ctx2) => (offset2) => (t) =>
            f(t)<S>(ctx2)(offset2)(onF)(onS)
        );

export const failDecoder =
    (message: string): Decoder<[]> => (ctx) => () => (onF) => () =>
        onF(ctx)([])("read failure: " + message);

export interface DecoderHkt extends Hkt1 {
    readonly type: Decoder<this["arg1"]>;
}

export const pureForDecoder: Pure<DecoderHkt> = { pure: pureDecoder };
export const functorForDecoder: Functor<DecoderHkt> = { map: mapDecoder };
export const monadForDecoder: Monad<DecoderHkt> = {
    map: mapDecoder,
    pure: pureDecoder,
    apply: applyDecoder,
    flatMap: flatMapDecoder,
};

export const onFailureIdentity =
    <S>(): FailureHandler<S> => (ctx) => (trace) => (msg) => ({
        type: "failure",
        message: `${msg}\n${
            trace.map((entry, i) => `${i + 1}: ${entry}`).join("\n")
        }`,
        input: ctx.input,
    });

export const onSuccessIdentity =
    <T>(): SuccessHandler<T, T> => (ctx) => (currentIndex) => (result) => ({
        type: "done",
        state: result,
        rest: new DataView(ctx.input.buffer.slice(currentIndex)),
    });

export const runDecoder =
    <T>(g: Decoder<T>) => (data: ArrayBufferLike): Result<string, T> => {
        const res = g<T>({
            input: new DataView(data),
            buffer: none(),
            more: ["completed"],
        })(0)(onFailureIdentity())(
            onSuccessIdentity(),
        );
        switch (res.type) {
            case "failure":
                return err(res.message);
            case "done":
                return ok(res.state);
            case "partial":
                return err("unexpected partial result");
        }
    };

export const runDecoderChunk =
    <T>(g: Decoder<T>) =>
    (len: Option<number>) =>
    (input: DataView): ParseResult<T> =>
        g<T>({ input, buffer: none(), more: ["more", len] })(0)(
            onFailureIdentity(),
        )(onSuccessIdentity());

export const runDecoderPartial = <T>(
    g: Decoder<T>,
): (input: DataView) => ParseResult<T> => runDecoderChunk(g)(none());

export const runDecoderStateAndRest =
    <T>(g: Decoder<T>) =>
    (input: DataView) =>
    (offset: number): readonly [result: Result<string, T>, rest: DataView] => {
        const res = g<T>({
            input: new DataView(input.buffer.slice(offset)),
            buffer: none(),
            more: ["completed"],
        })(0)(onFailureIdentity())(onSuccessIdentity());
        switch (res.type) {
            case "failure":
                return [err(res.message), res.input];
            case "done":
                return [ok(res.state), res.rest];
            case "partial":
                return [err(""), new DataView(new ArrayBuffer(0))];
        }
    };

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

export const ensure =
    (atLeast: number): Decoder<DataView> =>
    (ctx) =>
    (offset) =>
    (onFailure) =>
    (onSuccess) => {
        const restLen = atLeast - ctx.input.byteLength;
        if (restLen <= 0) {
            return onSuccess(ctx)(offset)(ctx.input);
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
            (offset: number) =>
            (ctx: DecContext) =>
            (acc: readonly DataView[]) =>
            (state: number) =>
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
                const [, needToRead] = ctx.more;
                return {
                    type: "partial",
                    resume: (b) => {
                        if (b.byteLength === 0) {
                            return tooFewBytes();
                        }
                        const moreReading = map((len: number) =>
                            len - b.byteLength
                        )(needToRead);
                        return checkIfEnough(offset)({
                            ...ctx,
                            input: new DataView(b),
                            more: ["more", moreReading],
                        })(acc)(state)(onFailure)(onSuccess);
                    },
                };
            };
        const checkIfEnough =
            (offset: number) =>
            (ctx: DecContext) =>
            (acc: readonly DataView[]) =>
            (state: number) =>
            <S>(onFailure: FailureHandler<S>) =>
            (onSuccess: SuccessHandler<DataView, S>): ParseResult<S> => {
                const restLen = offset - ctx.input.byteLength;
                if (restLen <= 0) {
                    const input = finalInput(ctx.input)(acc);
                    const buffer = finalBuffer(ctx.buffer)(ctx.input)(acc);
                    return onSuccess({ ...ctx, input, buffer })(offset)(input);
                }
                return getMore(restLen)(ctx)(acc)(state)(onFailure)(onSuccess);
            };
        return getMore(offset)(ctx)([])(offset)(onFailure)(onSuccess);
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

export const isolate = (blockLen: number) => <T>(g: Decoder<T>): Decoder<T> =>
    doT(monadForDecoder)
        .run(
            when(pureForDecoder)(blockLen < 0)(
                failDecoder("block length must not be negative"),
            ),
        )
        .addM("bytes", ensure(blockLen))
        .addWith("splitted", ({ bytes }) => splitAt(blockLen)(bytes))
        .addM("curr", parsedBytes)
        .runWith(({ splitted, curr }) => putRaw(splitted[0])(curr))
        .addM("value", g)
        .addM("raw", decodeRaw)
        .runWith(({ raw }) =>
            when(pureForDecoder)(raw.byteLength === 0)(
                failDecoder("not all bytes parsed"),
            )
        )
        .runWith(({ splitted, curr }) => putRaw(splitted[1])(curr + blockLen))
        .finish(({ value }) => value);

export const skip = (items: number): Decoder<[]> =>
    doT(monadForDecoder)
        .addM("bytes", ensure(items))
        .addM("curr", parsedBytes)
        .finishM(({ bytes, curr }) =>
            putRaw(
                new DataView(new Uint8Array(bytes.buffer).slice(items).buffer),
            )(
                curr + items,
            )
        );

export const lookAheadOrFail =
    <T>(g: Decoder<T>): Decoder<T> =>
    (ctx) =>
    (offset) =>
    <S>(onF: FailureHandler<S>) =>
    (onS: SuccessHandler<T, S>) =>
        g<S>({ ...ctx, buffer: emptyBuffer })(offset)((ctxF) =>
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

export const lookAhead = <T>(g: Decoder<Option<T>>): Decoder<Option<T>> =>
    doT(monadForDecoder)
        .addM("bytes", decodeRaw)
        .addM("pre", parsedBytes)
        .addM("opt", g)
        .runWith(({ bytes, pre, opt }) =>
            when(pureForDecoder)(isNone(opt))(putRaw(bytes)(pre))
        )
        .finish(({ opt }) => opt);

export const lookAheadIfOk = <E, T>(
    g: Decoder<Result<E, T>>,
): Decoder<Result<E, T>> =>
    doT(monadForDecoder)
        .addM("bytes", decodeRaw)
        .addM("pre", parsedBytes)
        .addM("res", g)
        .runWith(({ bytes, pre, res }) =>
            isErr(res) ? putRaw(bytes)(pre) : pureDecoder([])
        ).finish(({ res }) => res);

export const unparsedBytes: Decoder<number> =
    (ctx) => (offset) => () => (onS) =>
        onS(ctx)(offset)(ctx.input.byteLength + neededLen(ctx.more));

export const isEmpty: Decoder<boolean> = (ctx) => (offset) => () => (onS) =>
    onS(ctx)(offset)(ctx.input.byteLength === 0 && neededLen(ctx.more) === 0);

export const decBytes = (nBytes: number): Decoder<DataView> =>
    doT(monadForDecoder)
        .addM("bytes", ensure(nBytes))
        .addWith("splitted", ({ bytes }) => splitAt(nBytes)(bytes))
        .addM("curr", parsedBytes)
        .runWith(({ splitted, curr }) => putRaw(splitted[1])(curr + nBytes))
        .finish(({ splitted }) => splitted[0]);

export const decI8: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(1))
    .finish(({ view }) => view.getInt8(0));
export const decI16Be: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(2))
    .finish(({ view }) => view.getInt16(0));
export const decI16Le: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(2))
    .finish(({ view }) => view.getInt16(0, true));
export const decI32Be: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(4))
    .finish(({ view }) => view.getInt32(0));
export const decI32Le: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(4))
    .finish(({ view }) => view.getInt32(0, true));
export const decI64Be: Decoder<bigint> = doT(monadForDecoder)
    .addM("view", decBytes(8))
    .finish(({ view }) => view.getBigInt64(0));
export const decI64Le: Decoder<bigint> = doT(monadForDecoder)
    .addM("view", decBytes(8))
    .finish(({ view }) => view.getBigInt64(0, true));

export const decU8: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(1))
    .finish(({ view }) => view.getUint8(0));
export const decU16Be: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(2))
    .finish(({ view }) => view.getUint16(0));
export const decU16Le: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(2))
    .finish(({ view }) => view.getUint16(0, true));
export const decU32Be: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(4))
    .finish(({ view }) => view.getUint32(0));
export const decU32Le: Decoder<number> = doT(monadForDecoder)
    .addM("view", decBytes(4))
    .finish(({ view }) => view.getUint32(0, true));
export const decU64Be: Decoder<bigint> = doT(monadForDecoder)
    .addM("view", decBytes(8))
    .finish(({ view }) => view.getBigUint64(0));
export const decU64Le: Decoder<bigint> = doT(monadForDecoder)
    .addM("view", decBytes(8))
    .finish(({ view }) => view.getBigUint64(0, true));

export const decUtf8: Decoder<string> = doT(monadForDecoder)
    .addM("len", decU32Be)
    .addMWith("bytes", ({ len }) => decBytes(len))
    .finish(({ bytes }) => new TextDecoder().decode(bytes));

export const parsedBytes: Decoder<number> = (ctx) => (offset) => () => (onS) =>
    onS(ctx)(offset)(offset);

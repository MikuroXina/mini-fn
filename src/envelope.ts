import { doT } from "./cat.js";
import {
    type Code,
    type Decoder,
    decUtf8,
    type Encoder,
    encUtf8,
    failDecoder,
    monadForCodeM,
    monadForDecoder,
} from "./serial.js";

/**
 * A envelope object to transport data into another machine.
 */
export type Envelope<T> = Readonly<{
    /**
     * The namespace URL of your data. It can be an URL to the scheme of your data format.
     */
    namespace: string;
    /**
     * The packed payload object.
     */
    payload: T;
}>;

/**
 * Packs a payload object into a new envelope.
 *
 * @param namespace - The namespace URL of your data. It can be an URL to the scheme of your data format.
 * @param payload - A payload object to be packed.
 * @returns The new envelope with `payload`.
 */
export const pack =
    (namespace: string) =>
    <T>(payload: T): Envelope<T> => ({
        namespace,
        payload,
    });

/**
 * Creates an `Encoder` for `Envelope<T>` from a `Encoder<T>`.
 *
 * @param encodeT - A payload encoder.
 * @returns The new encoder for `Envelope<T>`.
 */
export const encode =
    <T>(encodeT: Encoder<T>): Encoder<Envelope<T>> =>
    (env: Envelope<T>): Code =>
        doT(monadForCodeM)
            .run(encUtf8(env.namespace))
            .finishM(() => encodeT(env.payload));
/**
 * Creates a `Decoder` for `Envelope<T>` from the namespace and a `Decoder<T>`. It fails when found a namespace that didn't equal to `namespace`.
 *
 * @param namespace - The expected namespace of data.
 * @param decodeT - A payload decoder.
 * @returns The new decoder for `Envelope<T>`.
 */
export const decodeFor =
    (namespace: string) =>
    <T>(decodeT: Decoder<T>): Decoder<Envelope<T>> =>
        doT(monadForDecoder)
            .addM("actualNamespace", decUtf8())
            .when(
                ({ actualNamespace }) => actualNamespace !== namespace,
                ({ actualNamespace }) =>
                    failDecoder(
                        `expected namespace '${namespace}' but found '${actualNamespace}'`,
                    ),
            )
            .addM("payload", decodeT)
            .finish(({ payload }) => pack(namespace)(payload));

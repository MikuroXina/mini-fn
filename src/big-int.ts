import type { Serialize } from "./serialize.ts";
import {
    type Deserialize,
    newVisitor,
    pure,
    runVoidVisitor,
    type Visitor,
    type VoidVisitorHkt,
} from "./deserialize.ts";
import { err } from "./result.ts";
import { DeserializeErrorBase } from "./deserialize.ts";

export const serialize: Serialize<bigint> = (v) => (ser) =>
    ser.serializeBigInt(v);

export const visitor: Visitor<VoidVisitorHkt<bigint>> = newVisitor("bigint")({
    visitString: <E extends DeserializeErrorBase>(value: string) => {
        try {
            return pure<E, VoidVisitorHkt<bigint>>(BigInt(value));
        } catch (_: unknown) {
            return () =>
                err(
                    (() =>
                        `expected integer, but got: ${value}`) as unknown as E,
                );
        }
    },
    visitNumber: <E extends DeserializeErrorBase>(value: number) =>
        Number.isSafeInteger(value)
            ? pure<E, VoidVisitorHkt<bigint>>(BigInt(value))
            : () =>
                err(
                    (() =>
                        `expected safe integer, but got: ${value}`) as unknown as E,
                ),
    visitBigInt: <E extends DeserializeErrorBase>(value: bigint) =>
        pure<E, VoidVisitorHkt<bigint>>(value),
});

export const deserialize: Deserialize<bigint> = (de) =>
    runVoidVisitor(de.deserializeBigInt(visitor));

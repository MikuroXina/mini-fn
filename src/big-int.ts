import type { Serialize } from "./serialize.ts";
import { type Deserialize, newVisitor, type Visitor } from "./deserialize.ts";
import { err, ok } from "./result.ts";

export const serialize: Serialize<bigint> = (v) => (ser) =>
    ser.serializeBigInt(v);

export const visitor: Visitor<bigint> = newVisitor("bigint")({
    visitString: (value) => () => {
        try {
            return ok(BigInt(value));
        } catch (_: unknown) {
            return err(() => `expected integer, but got: ${value}`);
        }
    },
    visitNumber: (value) => () =>
        Number.isSafeInteger(value)
            ? ok(BigInt(value))
            : err(() => `expected safe integer, but got: ${value}`),
    visitBigInt: (value) => () => ok(value),
});

export const deserialize: Deserialize<bigint> = (de) =>
    de.deserializeBigInt(visitor);

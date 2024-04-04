import type { Serialize } from "./serialize.ts";

export const serialize: Serialize<bigint> = (v) => (ser) =>
    ser.serializeBigInt(v);

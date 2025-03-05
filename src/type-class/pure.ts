import type { Get1 } from "../hkt.ts";

export type Pure<S> = {
    readonly pure: <T>(t: T) => Get1<S, T>;
};

export const when =
    <S>(app: Pure<S>) =>
    (cond: boolean) =>
    (op: Get1<S, never[]>): Get1<S, never[]> => cond ? op : app.pure([]);

export const unless =
    <S>(app: Pure<S>) =>
    (cond: boolean) =>
    (op: Get1<S, never[]>): Get1<S, never[]> => cond ? app.pure([]) : op;

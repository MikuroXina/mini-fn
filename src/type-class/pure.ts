import type { Get1 } from "../hkt.ts";

export interface Pure<S> {
    readonly pure: <T>(t: T) => Get1<S, T>;
}

export const when =
    <S>(app: Pure<S>) => (cond: boolean) => (op: Get1<S, []>): Get1<S, []> =>
        cond ? op : app.pure([]);

export const unless =
    <S>(app: Pure<S>) => (cond: boolean) => (op: Get1<S, []>): Get1<S, []> =>
        cond ? app.pure([]) : op;

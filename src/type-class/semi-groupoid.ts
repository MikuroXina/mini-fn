import type { GetHktA2, GetHktA3, GetHktA4, Hkt2 } from "../hkt.js";

export interface SemiGroupoid<Sym extends symbol> {
    readonly compose: <A, B, C>(
        funcA: Hkt2<Sym, A, B>,
    ) => (funcB: Hkt2<Sym, B, C>) => Hkt2<Sym, A, C>;
}

export interface SemiGroupoid2<S> {
    readonly compose: <A, B, C>(
        funcA: GetHktA2<S, A, B>,
    ) => (funcB: GetHktA2<S, B, C>) => GetHktA2<S, A, C>;
}
export interface SemiGroupoid3<S> {
    readonly compose: <A, B, C, D>(
        funcA: GetHktA3<S, A, B, D>,
    ) => (funcB: GetHktA3<S, B, C, D>) => GetHktA3<S, A, C, D>;
}
export interface SemiGroupoid4<S> {
    readonly compose: <A, B, C, D, E>(
        funcA: GetHktA4<S, A, B, D, E>,
    ) => (funcB: GetHktA4<S, B, C, D, E>) => GetHktA4<S, A, C, D, E>;
}

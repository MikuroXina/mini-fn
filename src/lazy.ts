import { Eq, PartialEq, eqSymbol } from "./type-class/eq.js";

const lazyNominal = Symbol("Lazy");

export interface Lazy<L> {
    [lazyNominal]: () => L;
}

export const defer = <L>(deferred: () => L): Lazy<L> => ({ [lazyNominal]: deferred });

export const force = <L>(lazy: Lazy<L>): L => lazy[lazyNominal]();

export const partialEq = <T>(equality: PartialEq<T, T>): PartialEq<Lazy<T>, Lazy<T>> => ({
    eq: (a, b) => equality.eq(force(a), force(b)),
});
export const eq = <T>(equality: Eq<T, T>): Eq<Lazy<T>, Lazy<T>> => ({
    ...partialEq(equality),
    [eqSymbol]: true,
});

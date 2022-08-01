export interface Hkt<Symbol extends symbol, A> {
    _symbol: Symbol;
    _args: A;
}

export interface HktDictA1<A1> {}
export interface HktDictA2<A1, A2> extends HktDictA1<A1> {}
export interface HktDictA3<A1, A2, A3> extends HktDictA2<A1, A2> {}
export interface HktDictA4<A1, A2, A3, A4> extends HktDictA3<A1, A2, A3> {}

export type HktA1 = keyof HktDictA1<any>;
export type HktA2 = keyof HktDictA2<any, any>;
export type HktA3 = keyof HktDictA3<any, any, any>;
export type HktA4 = keyof HktDictA4<any, any, any, any>;

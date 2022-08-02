export interface Hkt<Symbol extends symbol, A1> {
    _symbol: Symbol;
    _arg1: A1;
}
export interface Hkt2<Symbol extends symbol, A1, A2> extends Hkt<Symbol, A1> {
    _arg2: A2;
}
export interface Hkt3<Symbol extends symbol, A1, A2, A3> extends Hkt2<Symbol, A1, A2> {
    _arg3: A3;
}
export interface Hkt4<Symbol extends symbol, A1, A2, A3, A4> extends Hkt3<Symbol, A1, A2, A3> {
    _arg4: A4;
}

export interface HktDictA1<A1> {}
export interface HktDictA2<A1, A2> extends HktDictA1<A1> {}
export interface HktDictA3<A1, A2, A3> extends HktDictA2<A1, A2> {}
export interface HktDictA4<A1, A2, A3, A4> extends HktDictA3<A1, A2, A3> {}

export type HktA1 = keyof HktDictA1<any>;
export type HktA2 = keyof HktDictA2<any, any>;
export type HktA3 = keyof HktDictA3<any, any, any>;
export type HktA4 = keyof HktDictA4<any, any, any, any>;

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

export interface Hkt<Symbol extends symbol, A1> {}
export interface Hkt2<Symbol extends symbol, A1, A2> extends Hkt<symbol, A1> {}
export interface Hkt3<Symbol extends symbol, A1, A2, A3> extends Hkt2<symbol, A1, A2> {}
export interface Hkt4<Symbol extends symbol, A1, A2, A3, A4> extends Hkt3<symbol, A1, A2, A3> {}

export interface HktDictA1<A1> {}
export interface HktDictA2<A1, A2> extends HktDictA1<A1> {}
export interface HktDictA3<A1, A2, A3> extends HktDictA2<A1, A2> {}
export interface HktDictA4<A1, A2, A3, A4> extends HktDictA3<A1, A2, A3> {}

export type HktKeyA1 = keyof HktDictA1<unknown>;
export type HktKeyA2 = keyof HktDictA2<unknown, unknown>;
export type HktKeyA3 = keyof HktDictA3<unknown, unknown, unknown>;
export type HktKeyA4 = keyof HktDictA4<unknown, unknown, unknown, unknown>;

export type GetHktA1<S, A1> = S extends HktKeyA1 ? HktDictA1<A1>[S] : never;
export type GetHktA2<S, A1, A2> = S extends HktKeyA2 ? HktDictA2<A1, A2>[S] : never;
export type GetHktA3<S, A1, A2, A3> = S extends HktKeyA3 ? HktDictA3<A1, A2, A3>[S] : never;
export type GetHktA4<S, A1, A2, A3, A4> = S extends HktKeyA4 ? HktDictA4<A1, A2, A3, A4>[S] : never;

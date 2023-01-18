/// Type of order 0. `*`.
export interface Hkt0 {
    readonly type: unknown;
}
/// Type of order 1. `arg1 -> *`.
export interface Hkt1 extends Hkt0 {
    readonly arg1: unknown;
}
/// Type of order 2. `arg2 -> arg1 -> *`.
export interface Hkt2 extends Hkt1 {
    readonly arg2: unknown;
}
/// Type of order 3. `arg3 -> arg2 -> arg1 -> *`.
export interface Hkt3 extends Hkt2 {
    readonly arg3: unknown;
}
/// Type of order 4. `arg4 -> arg3 -> arg2 -> arg1 -> *`.
export interface Hkt4 extends Hkt3 {
    readonly arg4: unknown;
}

export type Apply1<S, A1> = S extends Hkt1
    ? S & {
          readonly arg1: A1;
      }
    : never;
export type Apply2Only<S, A2> = S extends Hkt2
    ? S & {
          readonly arg2: A2;
      }
    : never;
export type Apply2<S, A1, A2> = Apply1<S, A1> & Apply2Only<S, A2>;
export type Apply3Only<S, A3> = S extends Hkt3
    ? S & {
          readonly arg3: A3;
      }
    : never;
export type Apply3<S, A1, A2, A3> = Apply2<S, A1, A2> & Apply3Only<S, A3>;
export type Apply4Only<S, A4> = S extends Hkt4
    ? S & {
          readonly arg4: A4;
      }
    : never;
export type Apply4<S, A1, A2, A3, A4> = Apply3<S, A1, A2, A3> & Apply4Only<S, A4>;

export type Instance<S> = S extends Hkt0 ? S["type"] : never;

export type Get1<S, A1> = Instance<Apply1<S, A1>>;
export type Get2<S, A2, A1> = Instance<Apply2<S, A1, A2>>;
export type Get3<S, A3, A2, A1> = Instance<Apply3<S, A1, A2, A3>>;
export type Get4<S, A4, A3, A2, A1> = Instance<Apply4<S, A1, A2, A3, A4>>;

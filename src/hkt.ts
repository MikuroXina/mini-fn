/**
 * Type of order 0. `*`.
 */
export interface Hkt0 {
    readonly type: unknown;
}
/**
 * Type of order 1. `arg1 -> *`.
 */
export interface Hkt1 extends Hkt0 {
    readonly arg1: unknown;
}
/**
 * Type of order 2. `arg2 -> arg1 -> *`.
 */
export interface Hkt2 extends Hkt1 {
    readonly arg2: unknown;
}
/**
 * Type of order 3. `arg3 -> arg2 -> arg1 -> *`.
 */
export interface Hkt3 extends Hkt2 {
    readonly arg3: unknown;
}
/**
 * Type of order 4. `arg4 -> arg3 -> arg2 -> arg1 -> *`.
 */
export interface Hkt4 extends Hkt3 {
    readonly arg4: unknown;
}
/**
 * Type of order 5. `arg5 -> arg4 -> arg3 -> arg2 -> arg1 -> *`.
 */
export interface Hkt5 extends Hkt4 {
    readonly arg5: unknown;
}

/**
 * Applies the first type parameter to HKT.
 */
export type Apply1<S, A1> = S extends Hkt1 ? S & {
        readonly arg1: A1;
    }
    : never;
/**
 * Applies the second type parameter to HKT.
 */
export type Apply2Only<S, A2> = S extends Hkt2 ? S & {
        readonly arg2: A2;
    }
    : never;
/**
 * Applies the first and second type parameter to HKT.
 */
export type Apply2<S, A1, A2> = Apply1<S, A1> & Apply2Only<S, A2>;
/**
 * Applies the third type parameter to HKT.
 */
export type Apply3Only<S, A3> = S extends Hkt3 ? S & {
        readonly arg3: A3;
    }
    : never;
/**
 * Applies the first, second and third type parameter to HKT.
 */
export type Apply3<S, A1, A2, A3> = Apply2<S, A1, A2> & Apply3Only<S, A3>;
/**
 * Applies the fourth type parameter to HKT.
 */
export type Apply4Only<S, A4> = S extends Hkt4 ? S & {
        readonly arg4: A4;
    }
    : never;
/**
 * Applies the first, second, third and fourth type parameter to HKT.
 */
export type Apply4<S, A1, A2, A3, A4> =
    & Apply3<S, A1, A2, A3>
    & Apply4Only<S, A4>;
/**
 * Applies the fifth type parameter to HKT.
 */
export type Apply5Only<S, A5> = S extends Hkt5 ? S & {
        readonly arg4: A5;
    }
    : never;
/**
 * Applies the first, second, third, fourth and fifth type parameter to HKT.
 */
export type Apply5<S, A1, A2, A3, A4, A5> =
    & Apply4<S, A1, A2, A3, A4>
    & Apply5Only<S, A5>;

/**
 * Gets the applied type of HKT.
 */
export type Instance<S> = S extends Hkt0 ? S["type"] : never;

/**
 * Applies one type parameter and gets the applied type of HKT.
 */
export type Get1<S, A1> = Instance<Apply1<S, A1>>;
/**
 * Applies two type parameters and gets the applied type of HKT.
 */
export type Get2<S, A2, A1> = Instance<Apply2<S, A1, A2>>;
/**
 * Applies three type parameters and gets the applied type of HKT.
 */
export type Get3<S, A3, A2, A1> = Instance<Apply3<S, A1, A2, A3>>;
/**
 * Applies four type parameters and gets the applied type of HKT.
 */
export type Get4<S, A4, A3, A2, A1> = Instance<Apply4<S, A1, A2, A3, A4>>;
/**
 * Applies five type parameters and gets the applied type of HKT.
 */
export type Get5<S, A5, A4, A3, A2, A1> = Instance<
    Apply5<S, A1, A2, A3, A4, A5>
>;

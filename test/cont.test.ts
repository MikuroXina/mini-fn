import { Cat, Cont, Identity } from "../src/lib";

import { id } from "../src/func";

test("simple usage", () => {
    const calcLength = <A, R>(a: A[]): Cont.Cont<R, number> => Cont.pure(a.length);
    const double = <R>(num: number): Cont.Cont<R, number> => Cont.pure(num * 2);
    const callback = jest.fn();
    Cat.cat([1, 2, 3])
        .feed(calcLength)
        .feed(Cont.flatMap(double))
        .feed(Cont.runContT)
        .value(callback);
    expect(callback).toHaveBeenCalledWith(6);
});

test("using callCC", () => {
    const validateName =
        (name: string) =>
        (exit: (a: string) => Cont.Cont<string, []>): Cont.Cont<string, []> =>
            Cont.when(name.length === 0)(exit("expected at least 1 character"));
    const whatYourName = (name: string): string => {
        const cont = Cont.callCC<string, Identity.IdentityHktKey, string, []>(
            (exit) =>
                Cat.cat(validateName(name)(exit)).feed(
                    Cont.flatMap(() => Cont.pure(`Welcome, ${name}!`)),
                ).value,
        );
        return Cont.runCont(cont)(id);
    };
    expect(whatYourName("Alice")).toBe("Welcome, Alice!");
    expect(whatYourName("")).toBe("expected at least 1 character");
});

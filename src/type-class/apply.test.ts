import { expect, test } from "vitest";
import { Option, Ordering } from "../../mod.js";
import {
    type Apply,
    ap,
    apFirst,
    apSecond,
    apSelective,
    makeSemiGroup,
    map2,
} from "./apply.js";

const apply = Option.applicative as Apply<Option.OptionHkt>;

test("ap", () => {
    expect(
        ap(apply, apply)(Option.some(Option.some(3)))(
            Option.some(Option.some((x: number) => x * 2)),
        ),
    ).toStrictEqual(Option.some(Option.some(6)));
});
test("apFirst", () => {
    expect(apFirst(apply)(Option.some(3))(Option.some(4))).toStrictEqual(
        Option.some(3),
    );
    expect(apFirst(apply)(Option.some(3))(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(apFirst(apply)(Option.none())(Option.some(4))).toStrictEqual(
        Option.none(),
    );
    expect(apFirst(apply)(Option.none())(Option.none())).toStrictEqual(
        Option.none(),
    );
});
test("apSecond", () => {
    expect(apSecond(apply)(Option.some(3))(Option.some(4))).toStrictEqual(
        Option.some(4),
    );
    expect(apSecond(apply)(Option.some(3))(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(apSecond(apply)(Option.none())(Option.some(4))).toStrictEqual(
        Option.none(),
    );
    expect(apSecond(apply)(Option.none())(Option.none())).toStrictEqual(
        Option.none(),
    );
});
test("apSelective", () => {
    expect(
        apSelective(apply)("key")(Option.some({ x: 5 }))(Option.some("foo")),
    ).toStrictEqual(Option.some({ x: 5, key: "foo" }));
    expect(
        apSelective(apply)("key")(Option.some({ x: 5 }))(Option.none()),
    ).toStrictEqual(Option.none());
    expect(
        apSelective(apply)("key")(Option.none())(Option.some("foo")),
    ).toStrictEqual(Option.none());
    expect(
        apSelective(apply)("key")(Option.none())(Option.none()),
    ).toStrictEqual(Option.none());
});
test("map2", () => {
    const lifted = map2(apply)((x: string) => (y: string) => y + x);

    expect(lifted(Option.some("foo"))(Option.some("bar"))).toStrictEqual(
        Option.some("barfoo"),
    );
    expect(lifted(Option.none())(Option.some("bar"))).toStrictEqual(
        Option.none(),
    );
    expect(lifted(Option.some("foo"))(Option.none())).toStrictEqual(
        Option.none(),
    );
    expect(lifted(Option.none())(Option.none())).toStrictEqual(Option.none());
});
test("makeSemiGroup", () => {
    const m = makeSemiGroup(apply)(Ordering.monoid);

    for (const x of [Ordering.less, Ordering.equal, Ordering.greater]) {
        expect(
            m.combine(Option.some(Ordering.equal), Option.some(x)),
        ).toStrictEqual(Option.some(x));
        expect(
            m.combine(Option.some(Ordering.less), Option.some(x)),
        ).toStrictEqual(Option.some(Ordering.less));
        expect(
            m.combine(Option.some(Ordering.greater), Option.some(x)),
        ).toStrictEqual(Option.some(Ordering.greater));
    }
});

import {
    ap,
    apFirst,
    type Apply,
    apSecond,
    apSelective,
    makeSemiGroup,
    map2,
} from "./apply.ts";
import { Option, Ordering } from "../../mod.ts";
import { assertEquals } from "../../deps.ts";

const apply = Option.applicative as Apply<Option.OptionHkt>;

Deno.test("ap", () => {
    assertEquals(
        ap(apply, apply)(Option.some(Option.some(3)))(
            Option.some(Option.some((x: number) => x * 2)),
        ),
        Option.some(Option.some(6)),
    );
});
Deno.test("apFirst", () => {
    assertEquals(
        apFirst(apply)(Option.some(3))(Option.some(4)),
        Option.some(3),
    );
    assertEquals(apFirst(apply)(Option.some(3))(Option.none()), Option.none());
    assertEquals(apFirst(apply)(Option.none())(Option.some(4)), Option.none());
    assertEquals(apFirst(apply)(Option.none())(Option.none()), Option.none());
});
Deno.test("apSecond", () => {
    assertEquals(
        apSecond(apply)(Option.some(3))(Option.some(4)),
        Option.some(4),
    );
    assertEquals(apSecond(apply)(Option.some(3))(Option.none()), Option.none());
    assertEquals(apSecond(apply)(Option.none())(Option.some(4)), Option.none());
    assertEquals(apSecond(apply)(Option.none())(Option.none()), Option.none());
});
Deno.test("apSelective", () => {
    assertEquals(
        apSelective(apply)("key")(Option.some({ x: 5 }))(Option.some("foo")),
        Option.some({ x: 5, key: "foo" }),
    );
    assertEquals(
        apSelective(apply)("key")(Option.some({ x: 5 }))(Option.none()),
        Option.none(),
    );
    assertEquals(
        apSelective(apply)("key")(Option.none())(Option.some("foo")),
        Option.none(),
    );
    assertEquals(
        apSelective(apply)("key")(Option.none())(Option.none()),
        Option.none(),
    );
});
Deno.test("map2", () => {
    const lifted = map2(apply)((x: string) => (y: string) => y + x);

    assertEquals(
        lifted(Option.some("foo"))(Option.some("bar")),
        Option.some("barfoo"),
    );
    assertEquals(lifted(Option.none())(Option.some("bar")), Option.none());
    assertEquals(lifted(Option.some("foo"))(Option.none()), Option.none());
    assertEquals(lifted(Option.none())(Option.none()), Option.none());
});
Deno.test("makeSemiGroup", () => {
    const m = makeSemiGroup(apply)(Ordering.monoid);

    for (const x of [Ordering.less, Ordering.equal, Ordering.greater]) {
        assertEquals(
            m.combine(Option.some(Ordering.equal), Option.some(x)),
            Option.some(x),
        );
        assertEquals(
            m.combine(Option.some(Ordering.less), Option.some(x)),
            Option.some(Ordering.less),
        );
        assertEquals(
            m.combine(Option.some(Ordering.greater), Option.some(x)),
            Option.some(Ordering.greater),
        );
    }
});

import { assertEquals } from "../deps.ts";
import { catT } from "./cat.ts";
import { mapOr, none, Option, some } from "./option.ts";
import { local } from "./reader.ts";
import { run } from "./reader.ts";
import { ask } from "./reader.ts";
import { monad } from "./reader.ts";
import { Reader } from "./reader.ts";

Deno.test("ask", () => {
    interface User {
        name: string;
    }
    const userCat = catT(monad<User>());

    const message = (): Reader<User, string> =>
        userCat(ask<User>()).finish(
            ({ name }) => `Hello, ${name}!`,
        );
    const box = (): Reader<User, string> =>
        userCat(message()).finish(
            (mes) => `<div class="message-box">${mes}</div>`,
        );

    assertEquals(
        run(box())({ name: "John" }),
        '<div class="message-box">Hello, John!</div>',
    );
    assertEquals(
        run(box())({ name: "Alice" }),
        '<div class="message-box">Hello, Alice!</div>',
    );
});

Deno.test("local", () => {
    interface User {
        name: string;
        id: string;
        score: number;
    }
    interface Bulk {
        users: readonly User[];
    }

    const extractFromBulk = (id: string) =>
        local((bulk: Bulk): Option<User> => {
            const found = bulk.users.find((elem) => elem.id === id);
            if (!found) {
                return none();
            }
            return some(found);
        });
    const scoreReport = (id: string): Reader<Bulk, string> =>
        extractFromBulk(id)(
            catT(monad<Option<User>>())(ask<Option<User>>())
                .finish(
                    mapOr("user not found")(({ name, score }) =>
                        `${name}'s score is ${score}!`
                    ),
                ),
        );

    const bulk: Bulk = {
        users: [
            { name: "John", id: "1321", score: 12130 },
            { name: "Alice", id: "4209", score: 320123 },
        ],
    };
    assertEquals(run(scoreReport("1321"))(bulk), "John's score is 12130!");
    assertEquals(run(scoreReport("4209"))(bulk), "Alice's score is 320123!");
});

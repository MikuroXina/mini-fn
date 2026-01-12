import { expect, test } from "vitest";
import { catT } from "./cat.js";
import { mapOr, none, type Option, some } from "./option.js";
import type { Reader } from "./reader.js";
import { ask, local, monad, run } from "./reader.js";

test("ask", () => {
    interface User {
        name: string;
    }
    const userCat = catT(monad<User>());

    const message = (): Reader<User, string> =>
        userCat(ask<User>()).finish(({ name }) => `Hello, ${name}!`);
    const box = (): Reader<User, string> =>
        userCat(message()).finish(
            (mes) => `<div class="message-box">${mes}</div>`,
        );

    expect(run(box())({ name: "John" })).toStrictEqual(
        '<div class="message-box">Hello, John!</div>',
    );
    expect(run(box())({ name: "Alice" })).toStrictEqual(
        '<div class="message-box">Hello, Alice!</div>',
    );
});

test("local", () => {
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
            catT(monad<Option<User>>())(ask<Option<User>>()).finish(
                mapOr("user not found")(
                    ({ name, score }) => `${name}'s score is ${score}!`,
                ),
            ),
        );

    const bulk: Bulk = {
        users: [
            { name: "John", id: "1321", score: 12130 },
            { name: "Alice", id: "4209", score: 320123 },
        ],
    };
    expect(run(scoreReport("1321"))(bulk)).toStrictEqual(
        "John's score is 12130!",
    );
    expect(run(scoreReport("4209"))(bulk)).toStrictEqual(
        "Alice's score is 320123!",
    );
});

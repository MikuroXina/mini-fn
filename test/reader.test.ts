import { Option, mapOr, none, some } from "../src/option.js";
import { Reader, ask, local, map, run } from "../src/reader.js";
import { expect, test } from "vitest";

import { cat } from "../src/cat.js";

test("ask", () => {
    interface User {
        name: string;
    }
    const message = (): Reader<User, string> =>
        cat(ask<User>()).feed(map(({ name }) => `Hello, ${name}!`)).value;
    const box = (): Reader<User, string> =>
        cat(message()).feed(map((mes) => `<div class="message-box">${mes}</div>`)).value;

    expect(run(box())({ name: "John" })).toEqual('<div class="message-box">Hello, John!</div>');
    expect(run(box())({ name: "Alice" })).toEqual('<div class="message-box">Hello, Alice!</div>');
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
        cat(ask<Option<User>>())
            .feed(map(mapOr("user not found")(({ name, score }) => `${name}'s score is ${score}!`)))
            .feed(extractFromBulk(id)).value;

    const bulk: Bulk = {
        users: [
            {
                name: "John",
                id: "1321",
                score: 12130,
            },
            { name: "Alice", id: "4209", score: 320123 },
        ],
    };
    expect(run(scoreReport("1321"))(bulk)).toEqual("John's score is 12130!");
    expect(run(scoreReport("4209"))(bulk)).toEqual("Alice's score is 320123!");
});

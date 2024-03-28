import { assertEquals } from "../deps.ts";
import { compose, newEther, newEtherSymbol, runEther } from "./ether.ts";

type Article = {
    createdAt: string;
    updatedAt: string;
    body: string;
};

interface ArticleRepository {
    has: (id: string) => Promise<boolean>;
    insert: (id: string, article: Partial<Article>) => Promise<void>;
}
const repoSymbol = newEtherSymbol<ArticleRepository>();

type Req = {
    id: string;
    timestamp: string;
    body: string;
};
const serviceSymbol = newEtherSymbol<(req: Req) => Promise<void>>();
const service = newEther(
    serviceSymbol,
    ({ repo }) => async ({ id, timestamp, body }: Req) => {
        if (!await repo.has(id)) {
            return;
        }
        await repo.insert(id, { updatedAt: timestamp, body });
        return;
    },
    {
        repo: repoSymbol,
    },
);

Deno.test("runs an Ether", async () => {
    const mockRepository = newEther(
        repoSymbol,
        () => ({
            has: (id) => {
                assertEquals(id, "foo");
                return Promise.resolve(true);
            },
            insert: (id, article) => {
                assertEquals(id, "foo");
                assertEquals(article, {
                    updatedAt: "2020-01-01T13:17:00Z",
                    body: "Hello, World!",
                });
                return Promise.resolve();
            },
        }),
    );
    const injecting = compose(mockRepository);
    const ether = injecting(service);
    await runEther(ether)({
        id: "foo",
        timestamp: "2020-01-01T13:17:00Z",
        body: "Hello, World!",
    });
});

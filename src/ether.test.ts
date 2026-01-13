import { expect, test } from "vitest";
import { cat } from "./cat.js";
import {
    compose,
    composeT,
    liftEther,
    newEther,
    newEtherSymbol,
    newEtherT,
    runEther,
    runEtherT,
} from "./ether.js";
import { monad, type PromiseHkt } from "./promise.js";

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
    ({ repo }) =>
        async ({ id, timestamp, body }: Req) => {
            if (!(await repo.has(id))) {
                return;
            }
            await repo.insert(id, { updatedAt: timestamp, body });
            return;
        },
    {
        repo: repoSymbol,
    },
);

test("runs an Ether", async () => {
    const mockRepository = newEther(repoSymbol, () => ({
        has: (id) => {
            expect(id).toStrictEqual("foo");
            return Promise.resolve(true);
        },
        insert: (id, article) => {
            expect(id).toStrictEqual("foo");
            expect(article).toStrictEqual({
                updatedAt: "2020-01-01T13:17:00Z",
                body: "Hello, World!",
            });
            return Promise.resolve();
        },
    }));
    const injecting = compose(mockRepository);
    const ether = injecting(service);
    await runEther(ether)({
        id: "foo",
        timestamp: "2020-01-01T13:17:00Z",
        body: "Hello, World!",
    });
});

test("deps on Promise", async () => {
    type TokenVerifier = {
        verify: (token: string) => Promise<boolean>;
    };
    const tokenVerifierSymbol = newEtherSymbol<TokenVerifier>();
    const tokenVerifier = newEtherT<PromiseHkt>()(tokenVerifierSymbol, () =>
        Promise.resolve({
            verify: (token) => Promise.resolve(token.length === 3),
        }),
    );

    type PrivateRepository = {
        fetch: () => Promise<unknown>;
    };
    const privateRepositorySymbol = newEtherSymbol<PrivateRepository>();
    const privateRepository = newEther(privateRepositorySymbol, () => ({
        fetch: () => Promise.resolve({ flag: "YOU_ARE_AN_IDIOT" }),
    }));

    type PrivateFetcher = {
        fetch: (token: string) => Promise<unknown>;
    };
    const privateFetcherSymbol = newEtherSymbol<PrivateFetcher>();
    const privateFetcher = newEther(
        privateFetcherSymbol,
        ({ verifier, repo }) => ({
            fetch: async (token) => {
                if (!(await verifier.verify(token))) {
                    throw new Error("token verification failure");
                }
                return repo.fetch();
            },
        }),
        {
            verifier: tokenVerifierSymbol,
            repo: privateRepositorySymbol,
        },
    );

    const composePromise = composeT(monad);
    const liftPromise = liftEther(monad);
    const composed = await cat(liftPromise(privateFetcher))
        .feed(composePromise(tokenVerifier))
        .feed(composePromise(liftPromise(privateRepository)))
        .feed(runEtherT).value;

    expect(await composed.fetch("foo")).toStrictEqual({
        flag: "YOU_ARE_AN_IDIOT",
    });
});

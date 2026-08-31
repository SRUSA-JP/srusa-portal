import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "#functions/_middleware.js";

const authorizationHeader = (username, password) => {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return `Basic ${btoa(binary)}`;
};

const createContext = (options = {}) => {
  const { authorization } = options;
  const username = Object.hasOwn(options, "username")
    ? options.username
    : "member";
  const password = Object.hasOwn(options, "password")
    ? options.password
    : "temporary-password";
  let nextCallCount = 0;
  const headers = new Headers();

  if (authorization !== undefined) {
    headers.set("Authorization", authorization);
  }

  return {
    context: {
      env: {
        BASIC_AUTH_USERNAME: username,
        BASIC_AUTH_PASSWORD: password,
      },
      request: new Request("https://srusa-portal.pages.dev/", { headers }),
      next: async () => {
        nextCallCount += 1;
        return new Response("site", {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      },
    },
    nextCallCount: () => nextCallCount,
  };
};

test("Secretが未設定ならfail-closedで503を返す", async () => {
  const { context, nextCallCount } = createContext({ username: undefined });
  const response = await onRequest(context);

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(nextCallCount(), 0);
});

test("AuthorizationヘッダーがなければBasic認証を要求する", async () => {
  const { context, nextCallCount } = createContext();
  const response = await onRequest(context);

  assert.equal(response.status, 401);
  assert.equal(
    response.headers.get("WWW-Authenticate"),
    'Basic realm="SRUSA Portal", charset="UTF-8"',
  );
  assert.equal(nextCallCount(), 0);
});

for (const authorization of [
  "Bearer token",
  "Basic !!!",
  `Basic ${btoa("username-without-separator")}`,
]) {
  test(`不正なAuthorizationヘッダーを拒否する: ${authorization}`, async () => {
    const { context, nextCallCount } = createContext({ authorization });
    const response = await onRequest(context);

    assert.equal(response.status, 401);
    assert.equal(nextCallCount(), 0);
  });
}

test("誤ったユーザー名を拒否する", async () => {
  const { context, nextCallCount } = createContext({
    authorization: authorizationHeader("outsider", "temporary-password"),
  });
  const response = await onRequest(context);

  assert.equal(response.status, 401);
  assert.equal(nextCallCount(), 0);
});

test("誤ったパスワードを拒否する", async () => {
  const { context, nextCallCount } = createContext({
    authorization: authorizationHeader("member", "wrong-password"),
  });
  const response = await onRequest(context);

  assert.equal(response.status, 401);
  assert.equal(nextCallCount(), 0);
});

test("正しい資格情報なら静的コンテンツを返してキャッシュを制限する", async () => {
  const { context, nextCallCount } = createContext({
    authorization: authorizationHeader("member", "temporary-password"),
  });
  const response = await onRequest(context);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "site");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Authorization");
  assert.equal(nextCallCount(), 1);
});

test("UTF-8の資格情報とコロンを含むパスワードを扱える", async () => {
  const username = "利用者";
  const password = "仮:パスワード";
  const { context } = createContext({
    authorization: authorizationHeader(username, password),
    username,
    password,
  });
  const response = await onRequest(context);

  assert.equal(response.status, 200);
});

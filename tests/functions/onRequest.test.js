import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "#functions/_middleware.js";

const authorizationHeader = (username, password) => {
  return `Basic ${btoa(`${username}:${password}`)}`;
};

test("CloudflareのSecretが未設定なら503を返す", async () => {
  const response = await onRequest({
    env: {},
    request: new Request("https://srusa-portal.pages.dev/"),
    next: async () => new Response("site"),
  });

  assert.equal(response.status, 503);
});
test("Cloudflareのコンテキストを認証処理へ接続する", async () => {
  const username = "member";
  const password = "temporary-password";
  let nextCallCount = 0;
  const response = await onRequest({
    env: {
      BASIC_AUTH_USERNAME: username,
      BASIC_AUTH_PASSWORD: password,
    },
    request: new Request("https://srusa-portal.pages.dev/", {
      headers: {
        Authorization: authorizationHeader(username, password),
      },
    }),
    next: async () => {
      nextCallCount += 1;
      return new Response("site");
    },
  });

  assert.equal(response.status, 200);
  assert.equal(nextCallCount, 1);
});

import { createBasicAuthentication } from "../src/authentication/createBasicAuthentication.js";

/**
 * Cloudflare Pagesへの全リクエストを共有Basic認証で保護する。
 *
 * @param {{
 *   env: {
 *     BASIC_AUTH_USERNAME?: string,
 *     BASIC_AUTH_PASSWORD?: string
 *   },
 *   request: Request,
 *   next: () => Promise<Response>
 * }} context Pages Functionsから渡されるリクエストコンテキスト
 * @returns {Promise<Response>} 認証結果または認証済みの静的レスポンス
 */
export const onRequest = async (context) => {
  const { authenticate } = createBasicAuthentication({
    username: context.env?.BASIC_AUTH_USERNAME,
    password: context.env?.BASIC_AUTH_PASSWORD,
  });

  return authenticate({
    request: context.request,
    next: () => context.next(),
  });
};

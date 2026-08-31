const createBasicAuthentication = (context) => {
  const authenticationRealm = "SRUSA Portal";
  const noStoreHeaders = {
    "Cache-Control": "private, no-store",
    "Content-Type": "text/plain; charset=UTF-8",
  };

  const unauthorizedResponse = () => {
    return new Response("認証が必要です。", {
      status: 401,
      headers: {
        ...noStoreHeaders,
        "WWW-Authenticate": `Basic realm="${authenticationRealm}", charset="UTF-8"`,
      },
    });
  };

  const unavailableResponse = () => {
    return new Response("認証設定を確認してください。", {
      status: 503,
      headers: noStoreHeaders,
    });
  };

  const decodeCredentials = (authorization) => {
    if (typeof authorization !== "string") {
      return null;
    }

    const match = authorization.match(/^Basic\s+([^\s]+)$/i);
    if (!match) {
      return null;
    }

    try {
      const bytes = Uint8Array.from(atob(match[1]), (character) =>
        character.charCodeAt(0),
      );
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      const separator = decoded.indexOf(":");

      if (separator < 0) {
        return null;
      }

      return {
        username: decoded.slice(0, separator),
        password: decoded.slice(separator + 1),
      };
    } catch {
      return null;
    }
  };

  const securelyEqual = async (actual, expected) => {
    const encoder = new TextEncoder();
    const [actualDigest, expectedDigest] = await Promise.all([
      crypto.subtle.digest("SHA-256", encoder.encode(actual)),
      crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    ]);
    const actualBytes = new Uint8Array(actualDigest);
    const expectedBytes = new Uint8Array(expectedDigest);
    let difference = 0;

    for (let index = 0; index < actualBytes.length; index += 1) {
      difference |= actualBytes[index] ^ expectedBytes[index];
    }

    return difference === 0;
  };

  const protectResponse = (response) => {
    const protectedResponse = new Response(response.body, response);
    const vary = protectedResponse.headers.get("Vary");

    protectedResponse.headers.set("Cache-Control", "private, no-store");
    if (!vary) {
      protectedResponse.headers.set("Vary", "Authorization");
    } else if (
      !vary
        .split(",")
        .some((value) => value.trim().toLowerCase() === "authorization")
    ) {
      protectedResponse.headers.set("Vary", `${vary}, Authorization`);
    }

    return protectedResponse;
  };

  const authenticate = async () => {
    const username = context.env?.BASIC_AUTH_USERNAME;
    const password = context.env?.BASIC_AUTH_PASSWORD;

    if (
      typeof username !== "string" ||
      username.length === 0 ||
      typeof password !== "string" ||
      password.length === 0
    ) {
      return unavailableResponse();
    }

    const credentials = decodeCredentials(
      context.request.headers.get("Authorization"),
    );
    if (!credentials) {
      return unauthorizedResponse();
    }

    const [usernameMatches, passwordMatches] = await Promise.all([
      securelyEqual(credentials.username, username),
      securelyEqual(credentials.password, password),
    ]);

    if (!usernameMatches || !passwordMatches) {
      return unauthorizedResponse();
    }

    return protectResponse(await context.next());
  };

  return { authenticate };
};

/**
 * Cloudflare Pagesへの全リクエストを共有Basic認証で保護する。
 *
 * Cloudflare Pagesが`functions/_middleware.js`のexportを検出し、
 * HTTPリクエストごとにこの関数を呼び出す。
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
  const { authenticate } = createBasicAuthentication(context);
  const response = await authenticate();

  return response;
};

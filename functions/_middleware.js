const AUTHENTICATION_REALM = "SRUSA Portal";
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Content-Type": "text/plain; charset=UTF-8",
};

function unauthorizedResponse() {
  return new Response("認証が必要です。", {
    status: 401,
    headers: {
      ...NO_STORE_HEADERS,
      "WWW-Authenticate": `Basic realm="${AUTHENTICATION_REALM}", charset="UTF-8"`,
    },
  });
}

function unavailableResponse() {
  return new Response("認証設定を確認してください。", {
    status: 503,
    headers: NO_STORE_HEADERS,
  });
}

function decodeCredentials(authorization) {
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
}

async function securelyEqual(actual, expected) {
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
}

function protectResponse(response) {
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
}

export async function onRequest(context) {
  const expectedUsername = context.env?.BASIC_AUTH_USERNAME;
  const expectedPassword = context.env?.BASIC_AUTH_PASSWORD;

  if (
    typeof expectedUsername !== "string" ||
    expectedUsername.length === 0 ||
    typeof expectedPassword !== "string" ||
    expectedPassword.length === 0
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
    securelyEqual(credentials.username, expectedUsername),
    securelyEqual(credentials.password, expectedPassword),
  ]);

  if (!usernameMatches || !passwordMatches) {
    return unauthorizedResponse();
  }

  return protectResponse(await context.next());
}

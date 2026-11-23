import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * lib/iblai/auth-utils.ts: the sign-in settings handed to the SDK, the
 * expired-session refresh, the SSO landing guard, and the login-return URL
 * the plan picker hands Stripe.
 */

const ENV_KEYS = ["NEXT_PUBLIC_AUTH_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_PLATFORM_BASE_DOMAIN"] as const;
const saved: Record<string, string | undefined> = {};

// config.ts captures process.env at module scope, so each test re-imports a
// fresh module instance after arranging the env.
const load = async () => import("../lib/iblai/auth-utils");

/** A signed-in tab on https://app.example.test/agents?q=1 of the org `acme`. */
function stubBrowser(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries({ app_tenant: "acme", ...entries }));
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  const win: Record<string, unknown> = {
    localStorage: ls,
    location: {
      origin: "https://app.example.test",
      hostname: "app.example.test",
      pathname: "/agents",
      search: "?q=1",
      href: "https://app.example.test/agents?q=1",
    },
  };
  win.self = win.top = win;
  // Each write replaces the string, so `cookie` holds the last cookie written.
  const doc = { cookie: "" };
  vi.stubGlobal("window", win);
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("document", doc);
  return { store, doc, location: win.location as { href: string } };
}

beforeEach(() => {
  vi.resetModules();
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("redirectToAuthSpa", () => {
  it("signs in to the app's org and saves the page to come back to", async () => {
    process.env.NEXT_PUBLIC_AUTH_URL = "https://login.example.test";
    const { store, location } = stubBrowser({ axd_token: "stale" });
    const { redirectToAuthSpa } = await load();
    await redirectToAuthSpa();
    const url = new URL(location.href);
    expect(`${url.origin}${url.pathname}`).toBe("https://login.example.test/login");
    expect(url.searchParams.get("app")).toBe("custom");
    expect(url.searchParams.get("redirect-to")).toBe("https://app.example.test");
    expect(url.searchParams.get("tenant")).toBe("acme");
    expect(url.searchParams.has("logout")).toBe(false);
    expect(store.get("redirect-to")).toBe("/agents?q=1");
    expect(store.has("axd_token")).toBe(false);
  });
});

describe("handleLogout", () => {
  it("keeps the org and ends at the Auth SPA's logout", async () => {
    process.env.NEXT_PUBLIC_AUTH_URL = "https://login.example.test";
    const { store, location } = stubBrowser({ tenant: "acme", axd_token: "t" });
    const { handleLogout } = await load();
    handleLogout();
    const url = new URL(location.href);
    expect(`${url.origin}${url.pathname}`).toBe("https://login.example.test/logout");
    expect(url.searchParams.get("redirect-to")).toBe("https://app.example.test");
    expect(url.searchParams.get("tenant")).toBe("acme");
    expect(store.get("tenant")).toBe("acme");
    expect(store.has("axd_token")).toBe(false);
  });

  it("sets the logout signal for sibling apps after clearing the cookies", async () => {
    const { doc } = stubBrowser({ tenant: "acme" });
    const { handleLogout } = await load();
    handleLogout();
    expect(doc.cookie.startsWith("ibl_logout_timestamp=")).toBe(true);
    expect(doc.cookie).toContain("domain=.example.test");
  });
});

describe("tokenRefreshUrl", () => {
  it("has the Auth SPA re-mint for the app's org and return to this page", async () => {
    process.env.NEXT_PUBLIC_AUTH_URL = "https://login.example.test";
    stubBrowser();
    const { tokenRefreshUrl } = await load();
    const url = new URL(tokenRefreshUrl());
    expect(`${url.origin}${url.pathname}`).toBe("https://login.example.test/login/complete");
    expect(url.searchParams.get("redirect-to")).toBe("https://app.example.test");
    expect(url.searchParams.get("redirect-path")).toBe("/agents?q=1");
    expect(url.searchParams.get("tenant")).toBe("acme");
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/agents?q=1", "/agents?q=1"],
    ["/", "/"],
    ["@evil.example/x", "/"],
    [".evil.example/x", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["https://evil.example", "/"],
    ["", "/"],
  ])("lands %j on %j", async (path, expected) => {
    const { safeRedirectPath } = await load();
    expect(safeRedirectPath(path)).toBe(expected);
  });
});

describe("loginReturnUrl", () => {
  it("nests the app's origin inside the login page on the auth host", async () => {
    process.env.NEXT_PUBLIC_AUTH_URL = "https://login.example.test";
    process.env.NEXT_PUBLIC_APP_URL = "https://acme.iblai.me";
    const { loginReturnUrl } = await load();
    const url = new URL(loginReturnUrl());
    expect(`${url.origin}${url.pathname}`).toBe("https://login.example.test/login");
    expect(url.searchParams.get("app")).toBe("custom");
    expect(url.searchParams.get("redirect-to")).toBe("https://acme.iblai.me");
  });

  it("takes an explicit origin", async () => {
    const { loginReturnUrl } = await load();
    const url = new URL(loginReturnUrl("http://localhost:3000"));
    expect(url.searchParams.get("redirect-to")).toBe("http://localhost:3000");
  });

  it("defaults to the hosted login page", async () => {
    const { loginReturnUrl } = await load();
    expect(loginReturnUrl("https://acme.example.test").startsWith("https://login.iblai.app/login?")).toBe(true);
  });
});

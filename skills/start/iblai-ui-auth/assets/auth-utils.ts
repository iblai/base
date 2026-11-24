/**
 * ibl.ai auth helper utilities.
 *
 * Sign-in and sign-out are the SDK's own (`@iblai/iblai-js/web-utils/auth`,
 * the functions iblai/os calls); this file supplies the app's settings. That
 * subpath carries no React, so any module may import it.
 */

import {
  handleLogout as sdkHandleLogout,
  hasNonExpiredAuthToken,
  isInIframe,
  redirectToAuthSpa as sdkRedirectToAuthSpa,
  setCookieForAuth,
} from "@iblai/iblai-js/web-utils/auth";

import config from "./config";
import { resolveAppTenant } from "./tenant";

/** Check if running inside a Tauri app. */
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

/**
 * Redirect to the ibl.ai Auth SPA for login. The SDK clears the stored
 * session, saves the path to come back to, and inside a frame asks the host
 * for a session instead of navigating.
 */
export async function redirectToAuthSpa(
  redirectTo?: string,
  platformKey?: string,
  logout?: boolean,
  saveRedirect = true,
) {
  return sdkRedirectToAuthSpa({
    redirectTo,
    platformKey: platformKey || resolveAppTenant() || undefined,
    logout,
    saveRedirect,
    authUrl: config.authUrl(),
    appName: "custom",
    // Where the path to come back to waits; /sso-login-complete reads it.
    redirectPathStorageKey: "redirect-to",
    hasNonExpiredAuthToken,
    // Tauri: the Auth SPA returns a Google/Apple sign-in on this scheme.
    isNativeApp: isTauri,
    scheme: config.tauriCustomScheme(),
  });
}

/**
 * Where an expired session goes: the Auth SPA's `/login/complete` mints fresh
 * tokens from its own session and returns to this page through
 * `/sso-login-complete` — a refresh, not a logout (iblai/os, lib/token-refresh.ts).
 */
export function tokenRefreshUrl(): string {
  const params = new URLSearchParams({
    "redirect-to": window.location.origin,
    "redirect-path": `${window.location.pathname}${window.location.search}`,
  });
  const tenant = resolveAppTenant();
  if (tenant) params.set("tenant", tenant);
  return `${config.authUrl()}/login/complete?${params}`;
}

/**
 * The landing guard for SsoLogin, which goes to `location.origin + path` and
 * takes `path` from `?redirect-path=` when none was saved: only a path with a
 * single leading slash stays on this origin (`@evil.example` would not).
 */
export function safeRedirectPath(path: string): string {
  return /^\/(?![/\\])/.test(path) ? path : "/";
}

/**
 * The login page with this app nested inside: where the platform returns a
 * person after a Stripe checkout. The checkout appends a sign-in token the
 * login page consumes, then it comes back to `origin`. The pricing session
 * only accepts a return URL on a domain it allows, and the login host is one;
 * an app's own domain is refused (400 "Redirect URL domain is not allowed").
 */
export function loginReturnUrl(origin: string = config.appUrl()): string {
  return `${config.authUrl()}/login?app=custom&redirect-to=${encodeURIComponent(origin)}`;
}

/**
 * Handle logout: clear the session (keeping `tenant`) and the cookies, end at
 * the Auth SPA's logout page, and signal sibling apps on this domain.
 */
export function handleLogout() {
  sdkHandleLogout({ authUrl: config.authUrl() });
  // Set after the SDK's cookie clear, which removes its own copy (as iblai/os).
  if (!isInIframe()) {
    setCookieForAuth("ibl_logout_timestamp", Date.now().toString());
  }
}

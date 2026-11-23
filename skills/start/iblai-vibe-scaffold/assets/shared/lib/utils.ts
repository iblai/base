import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  hasNonExpiredAuthToken,
  redirectToAuthSpa as sdkRedirectToAuthSpa,
} from "@iblai/iblai-js/web-utils/auth";
import { config } from "./config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

/**
 * Redirect to the Auth SPA for login/logout — the SDK's, as iblai/os calls it.
 * It clears the stored session, saves the path to come back to under
 * `redirect-to`, and inside a frame asks the host for a session instead.
 */
export async function redirectToAuthSpa(
  redirectTo?: string,
  platformKey?: string,
  logout?: boolean,
  saveRedirect = true,
): Promise<void> {
  return sdkRedirectToAuthSpa({
    redirectTo,
    platformKey: platformKey || config.mainTenantKey() || undefined,
    logout,
    saveRedirect,
    authUrl: config.authUrl(),
    appName: "agent",
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
 * `/sso-login-complete` — a refresh, not a logout.
 */
export function tokenRefreshUrl(): string {
  const params = new URLSearchParams({
    "redirect-to": window.location.origin,
    "redirect-path": `${window.location.pathname}${window.location.search}`,
  });
  const tenant = config.mainTenantKey();
  if (tenant) params.set("tenant", tenant);
  return `${config.authUrl()}/login/complete?${params}`;
}

/**
 * The landing guard for SsoLogin, which goes to `location.origin + path`:
 * only a path with a single leading slash stays on this origin.
 */
export function safeRedirectPath(path: string): string {
  return /^\/(?![/\\])/.test(path) ? path : "/";
}

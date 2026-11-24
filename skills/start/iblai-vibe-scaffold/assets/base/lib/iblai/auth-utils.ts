/**
 * Re-export auth utilities for ibl.ai feature components.
 *
 * This shim lets feature components (chat, profile, etc.) import from
 * "@/lib/iblai/auth-utils" regardless of how the project's auth files
 * were laid out.
 */

import {
  handleLogout as sdkHandleLogout,
  isInIframe,
  setCookieForAuth,
} from "@iblai/iblai-js/web-utils/auth";
import { config } from "@/lib/config";

export {
  redirectToAuthSpa,
  safeRedirectPath,
  tokenRefreshUrl,
} from "@/lib/utils";

/**
 * Clear the session (keeping `tenant`) and the cookies, end at the Auth SPA's
 * logout page, and signal sibling apps on this domain.
 */
export function handleLogout() {
  sdkHandleLogout({ authUrl: config.authUrl() });
  // Set after the SDK's cookie clear, which removes its own copy (as iblai/os).
  if (!isInIframe()) {
    setCookieForAuth("ibl_logout_timestamp", Date.now().toString());
  }
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

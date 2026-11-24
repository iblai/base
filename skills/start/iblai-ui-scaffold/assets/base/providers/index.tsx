"use client";
/**
 * Application providers — AuthProvider + TenantProvider.
 *
 * TenantProvider handles tenant fetching, validation, metadata loading,
 * and exposes TenantContext (useTenantContext) that SDK components like
 * the Account page's OrganizationTab depend on.
 */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  initializeDataLayer,
  type TokenResponse,
} from "@iblai/iblai-js/data-layer";
import { AuthProvider, TenantProvider } from "@iblai/iblai-js/web-utils";
import { config } from "@/lib/config";
import { redirectToAuthSpa, tokenRefreshUrl } from "@/lib/utils";
import { resolveAppTenant, checkTenantMismatch } from "@/lib/iblai/tenant";

// ---------------------------------------------------------------------------
// LocalStorageService for initializeDataLayer
// ---------------------------------------------------------------------------

class LocalStorageService {
  private static instance: LocalStorageService;
  static getInstance() {
    if (!this.instance) this.instance = new LocalStorageService();
    return this.instance;
  }
  async getItem<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) as T;
  }
  async setItem<T>(key: string, item: T): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, item as unknown as string);
  }
  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }
}

const storageService = LocalStorageService.getInstance();

// Routes that skip auth
const PUBLIC_ROUTES = new Map<RegExp, () => Promise<boolean>>([
  [new RegExp("^/sso-login"), async () => false],
]);

const LOADING = (
  <div className="flex min-h-screen items-center justify-center">
    <p className="text-sm text-gray-400">Loading…</p>
  </div>
);

// Tenant resolution: .env -> app_tenant -> localStorage tenant
// See lib/iblai/tenant.ts for the full priority logic.

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // initializeDataLayer MUST be called synchronously before any children
  // render so that Config.lmsUrl / Config.dmUrl are set before RTK Query
  // hooks (e.g. inside the Profile component) fire their first queries.
  // useState initializer runs during the render cycle, not after it.
  const [isInitialized] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      // (dmUrl, lmsUrl, legacyLmsUrl, storageService, httpErrorHandler,
      //  studioUrl, refreshAuthToken)
      // legacyLmsUrl is the non-consolidated LMS URL (same as lmsUrl here).
      initializeDataLayer(
        config.dmUrl(),
        config.lmsUrl(),
        config.lmsUrl(),
        storageService,
        {
          401: () => redirectToAuthSpa(undefined, undefined, true),
        },
        undefined,
        // An expired session goes back through the Auth SPA, as in iblai/os,
        // instead of a re-mint from the edX JWT. Never settles: the page is
        // leaving, and `false` would run the 401 handler, a logout.
        () => {
          window.location.href = tokenRefreshUrl();
          return new Promise<boolean>(() => {});
        },
      );
    } catch (e) {
      console.error("[IBL] initializeDataLayer failed:", e);
    }
    return true;
  });

  const username = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = localStorage.getItem("userData");
      if (raw) return JSON.parse(raw).user_nicename ?? "";
    } catch { /* ignore */ }
    return "";
  }, [isInitialized]);

  const currentTenant = useMemo(() => resolveAppTenant(), [isInitialized]);

  const handleTenantSwitch = useCallback(
    async (tenant: string, saveRedirect: boolean, useCustomDomain?: boolean) => {
      localStorage.setItem("current_tenant", JSON.stringify({ key: tenant }));
      localStorage.setItem("tenant", tenant);
      if (saveRedirect && typeof window !== "undefined") {
        localStorage.setItem("redirect-to", window.location.pathname);
      }
      // Reload so the app re-initializes with the new tenant
      window.location.reload();
    },
    [],
  );

  const saveCurrentTenant = useCallback(
    (tenant: { key: string; is_admin: boolean; org: string; platform_name: string }) => {
      localStorage.setItem("current_tenant", JSON.stringify(tenant));
      localStorage.setItem("tenant", tenant.key);

      // If the SDK resolved a different tenant than what the app expects,
      // redirect to re-login for the correct tenant.
      checkTenantMismatch();
    },
    [],
  );

  const saveUserTenants = useCallback(
    (tenants: { key: string; is_admin: boolean; org: string; platform_name: string }[]) => {
      localStorage.setItem("tenants", JSON.stringify(tenants));
    },
    [],
  );

  const isSsoRoute = pathname?.startsWith("/sso-login") ?? false;

  if (!isInitialized) {
    return LOADING;
  }

  return (
    <AuthProvider
      skip={isSsoRoute}
      redirectToAuthSpa={redirectToAuthSpa}
      username={username}
      pathname={pathname ?? "/"}
      storageService={storageService}
      middleware={PUBLIC_ROUTES}
      enableStorageSync
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-400">Authenticating…</p>
        </div>
      }
    >
      <TenantProvider
        skip={isSsoRoute}
        currentTenant={currentTenant}
        requestedTenant={currentTenant}
        handleTenantSwitch={handleTenantSwitch}
        saveCurrentTenant={saveCurrentTenant}
        saveUserTenants={saveUserTenants}
        // The fresh org-scoped pair from a re-auth; unsaved, the provider
        // loops on "User still does not belong to tenant after re-auth".
        saveUserTokens={(tokens: TokenResponse) => {
          if (tokens?.axd_token) {
            localStorage.setItem("axd_token", tokens.axd_token.token);
            localStorage.setItem("axd_token_expires", tokens.axd_token.expires);
          }
          if (tokens?.dm_token) {
            localStorage.setItem("dm_token", tokens.dm_token.token);
            localStorage.setItem("dm_token_expires", tokens.dm_token.expires);
          }
        }}
        redirectToAuthSpa={redirectToAuthSpa}
        username={username}
        fallback={LOADING}
      >
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}

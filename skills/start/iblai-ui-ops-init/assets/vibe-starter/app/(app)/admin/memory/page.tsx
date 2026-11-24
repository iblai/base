"use client";

import { AccountPanel } from "@/components/admin/account-panel";

/** Every user's global memories and every agent's memories (see /iblai-ui-memory). */
export default function AdminMemoryPage() {
  return <AccountPanel tab="memory" />;
}

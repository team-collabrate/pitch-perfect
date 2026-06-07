import { requireManager } from "~/server/admin/session";

import { ConfigPageClient } from "./config-page-client";

export default async function ConfigPage() {
  const { manager } = await requireManager();

  return <ConfigPageClient role={manager.role} />;
}

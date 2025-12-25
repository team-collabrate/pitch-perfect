import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { managers } from "~/server/db/schema";
import type { ManagerRole } from "~/lib/admin-nav";

export async function getManagerProfile() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const manager = await db.query.managers.findFirst({
    where: eq(managers.authId, session.user.id),
  });

  if (!manager) {
    return null;
  }

  return { session, manager };
}

export async function requireManager(options?: { superOnly?: boolean }) {
  const profile = await getManagerProfile();
  if (!profile) {
    redirect("/admin/login");
  }

  if (profile.manager.role === "staff") {
    redirect("/admin/login");
  }

  if (options?.superOnly && profile.manager.role !== "superAdmin") {
    redirect("/admin/bookings");
  }

  return profile;
}

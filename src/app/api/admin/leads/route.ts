import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listLeads } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    forbidden: "אין הרשאה",
  },
  en: {
    forbidden: "Not authorized",
  },
};

export async function GET() {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) {
    return NextResponse.json({ error: t.forbidden }, { status: 403 });
  }
  return NextResponse.json({ leads: await listLeads() });
}

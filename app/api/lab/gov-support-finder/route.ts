import { NextResponse } from "next/server";
import { getGovGrants } from "@/lib/gov";

export const dynamic = "force-dynamic";

export async function POST() {
  const { grants, live } = await getGovGrants({ rows: 30 });
  return NextResponse.json({ live, grants });
}

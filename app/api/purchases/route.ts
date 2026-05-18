import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const mod = await import("../../app/purchases/actions");
  const result = await mod.createPurchaseAction(formData as any);
  return NextResponse.json(result);
}

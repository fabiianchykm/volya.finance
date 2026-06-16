import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { assertSameOrigin } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  try {
    const originBlocked = assertSameOrigin(req);
    if (originBlocked) return originBlocked;

    const { action, orderId, contractId } = await req.json();

    if (action === "confirm") {
      const data = await ukaskoService.confirmPolicy(orderId);
      return NextResponse.json({ success: true, data });
    }

    if (action === "download") {
      const data = await ukaskoService.downloadContract(contractId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

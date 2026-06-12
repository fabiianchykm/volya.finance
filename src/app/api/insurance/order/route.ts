import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...orderData } = body;

    let result;
    if (action === "draft") {
      result = await ukaskoService.createDraft(orderData);
      console.log("[order] draft result:", JSON.stringify(result).slice(0, 300));
    } else if (action === "declare") {
      try {
        result = await ukaskoService.declarePolicy(orderData);
        console.log("[order] declare result:", JSON.stringify(result).slice(0, 300));
      } catch (declareErr) {
        console.error("[order] declare ERROR:", declareErr instanceof Error ? declareErr.message : declareErr);
        throw declareErr;
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  try {
    const { plate } = await params;
    const decoded = decodeURIComponent(plate).toUpperCase().replace(/\s/g, "");
    const data = await ukaskoService.getCarByPlate(decoded);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vehicle API]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

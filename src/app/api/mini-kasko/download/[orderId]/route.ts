import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";

// Проксі бінарного PDF поліса міні-КАСКО. Ukasko-ендпоінт неавторизований (за
// orderId), але ми стрімимо через себе, щоб не світити зовнішній домен клієнту.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  try {
    const { buffer, contentType } = await ukaskoService.downloadMiniKaskoPdf(decodeURIComponent(orderId));
    return new NextResponse(buffer, {
      headers: {
        "content-type": contentType,
        "content-disposition": `inline; filename="mini-kasko-${orderId}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Документ ще недоступний" }, { status: 404 });
  }
}
